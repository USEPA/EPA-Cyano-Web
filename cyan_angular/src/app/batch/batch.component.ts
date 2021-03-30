import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { DataSource } from '@angular/cdk/table';
import { MatSort } from '@angular/material/sort';
import { DatePipe } from '@angular/common';

import { AuthService } from '../services/auth.service';
import { DownloaderService } from '../services/downloader.service';
import { LoaderService } from '../services/loader.service';
import { 
  BatchJob,
  BatchLocation,
  BatchStatus,
  JobsTableParams,
  columnNames,
  csvKeys
} from '../models/batch';
import { DialogComponent } from '../shared/dialog/dialog.component';


@Component({
  selector: 'app-batch',
  templateUrl: './batch.component.html',
  styleUrls: ['./batch.component.css']
})
export class BatchComponent {
  /*
  Dialog for viewing a user image.
  */
  uploadedFile: File;  // user input file
  acceptedType: string = 'csv';  // accepted file type for upload
  maxFilenameLength: number = 128;  // max allowed length of filename
  numInputColumns: number = 3;  // number of columns in input file
  maxNumLocations: number = 1e3;  // max number of locations in input file
  status: string = '';  // job status
  pollStatusDelay: number = 2000;  // milliseconds
  intervalProcess: ReturnType<typeof setInterval>;  // keeps track of status polling
  currentJobStatus: BatchStatus;
  currentInputFilename: string = '';
  finishedStates: string[] = ['FAILURE', 'REVOKED', 'SUCCESS'];
  inProgressStates: string[] = ['RETRY', 'PENDING', 'RECEIVED', 'STARTED'];
  dataSource;  // data structure for user jobs table
  displayedColumns: string[] = [];
  columnNames: any[] = columnNames;

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('uploader') uploader;  // input file uploader

  constructor(
    public dialogRef: MatDialogRef<BatchComponent>,
    private authService: AuthService,
    private downloaderService: DownloaderService,
    private loaderService: LoaderService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private messageDialog: MatDialog,
    private datePipe: DatePipe,
  ) { }

  ngOnInit(): void {
    this.currentJobStatus = new BatchStatus();
    this.displayedColumns = this.columnNames.map(x => x.id);
  }

  ngOnDestroy(): void {
    this.status = '';
    this.uploadedFile = null;
    this.currentInputFilename = '';
    this.stopJobPolling();
  }

  exit(): void {
    this.dialogRef.close();
    this.ngOnDestroy();
  }

  clearFile(): void {
    this.uploader.nativeElement.value = '';
  }

  stopJobPolling(): void {
    console.log("Stopping job status polling.")
    clearInterval(this.intervalProcess);
  }

  pollJobStatus(batchStatus: BatchStatus): void {
    /*
    Polling loop that checks on user's job status.
    */
    console.log("Starting job status polling.")
    this.intervalProcess = setInterval(() => {
      if (!this.authService.checkUserAuthentication()) { 
        // Prevents polling forever from idle user
        this.stopJobPolling();
        return;
      }
      this.downloaderService.checkBatchJobStatus(batchStatus).subscribe(response => {
        if (response['status'].length > 0) {
          this.status = response['status'];
        }

        // Updates "Run" tab info
        this.currentJobStatus.job_id = response['job_id'];
        this.currentJobStatus.job_status = response['job_status'];

        // Updates "Jobs" tab info
        this.updateTableJob(response['job']);

        if (
          response['status'].includes("Failed")
          || this.finishedStates.includes(response['job_status'])
        ) {
          // Stops if job failed or is in a finished state.
          this.stopJobPolling();
          return;
        }

      });
    }, this.pollStatusDelay);
  }

  validateUploadedFile(event): any {
    /*
    Validates user-uploaded CSV file.
    */
    let uploadedFile = event.target.files[0];

    // Checks if filename has been defined:
    if (uploadedFile === undefined || uploadedFile.length <= 0) {
      return {"error": "Error uploading file."};
    }

    // Performs max filename length check:
    if (uploadedFile.length > this.maxFilenameLength) {
      return {"error": "Filename is too long (max " + this.maxFilenameLength + ")"}
    }

    // Checks for ".csv" extension at end of filename:
    let fileExtension = uploadedFile.name.split(".").splice(-1)[0];
    if (fileExtension != this.acceptedType) {
      return {"error": "File is not of type CSV."};
    }

    return uploadedFile;
  }

  validateFileContent(fileContent): any {
    /*
    Validates content of CSV input file.
    */
    
    let rows = fileContent.split('\n');
    let headers = rows[0].split(',');

    if (headers.length != this.numInputColumns) {
      return {'error': 'Input file has incorrect number of columns'};
    }

    if (rows.length > this.maxNumLocations) {
      return {'error': 'Number of locations exceeded (max is ' + this.maxNumLocations + ')'}
    }

    for (let index in headers) {
      let item = headers[index];
      if (!csvKeys.includes(this.cleanString(item))) {
        return {'error': 'Column "' + item + '" is an incorrect column name'};
      }
    }

    return {'data': fileContent};
  }

  cleanString(str) {
    return str.replace(/\r?\n|\r/g, "");
  }

  createBatchLocations(csvData: string): BatchLocation[] {
    // csvData ex: lat,lon,type\nval1,val2,val3\n
    let batchLocations: BatchLocation[] = [];
    let rows = csvData.split('\n');
    rows.slice(1, -1).forEach(row => {
      let rowArray = row.split(',');
      let batchLocation: BatchLocation = new BatchLocation();
      batchLocation.latitude = parseFloat(rowArray[0]);
      batchLocation.longitude = parseFloat(rowArray[1]);
      batchLocation.type = this.cleanString(rowArray[2]);  // weekly/daily
      batchLocations.push(batchLocation);
    });
    return batchLocations;
  }

  clearInputFields(): void {
    this.currentJobStatus.job_id = '';
    this.currentJobStatus.job_status = '';
    this.currentInputFilename = '';
  }

  uploadFile(event): void {
    /*
    Uploads CSV file of locations for data processing.
    */
    if (!this.authService.checkUserAuthentication()) { return; }

    this.clearInputFields();

    let file = this.validateUploadedFile(event);
    
    if ('error' in file) {
      this.displayMessageDialog(file.error);
      this.uploadedFile = null;
      return;
    }
    else {
      this.uploadedFile = file;
    }

    let reader = new FileReader();

    reader.onload = (e) => {
      let csvContent = this.validateFileContent(reader.result);

      if ('error' in csvContent) {
        this.displayMessageDialog(csvContent.error);
        this.uploadedFile = null;
        return;
      }
      else {
        csvContent = csvContent.data;
      }
      
      let locationObjects: BatchLocation[] = this.createBatchLocations(csvContent);

      let batchJob: BatchJob = new BatchJob();
      batchJob.filename = this.uploadedFile.name;
      batchJob.locations = locationObjects;
      batchJob.status = new BatchStatus();

      this.makeJobStartRequest(batchJob);  // starts batch job

    }
    reader.readAsText(this.uploadedFile);

    this.clearFile();  // enable uploading same filename on (change) multiple times
  }

  tabChange(event): void {
    /*
    Handles batch job tab change event, which
    makes a request to get user's jobs for building
    the "Jobs" table.
    */
    if (event.index == 1) {
      // "Jobs" tab - loads all of user's jobs
      this.downloaderService.getBatchJobs().subscribe(response => {
        if (response['status'] == false) {
          this.displayMessageDialog("Cannot display batch jobs");
        }
        this.createTable(response);
      });
    }
  }

  createTable(jobsResponse): void {
    /*
    Creates table object in "Jobs" tab.
    */
    let tableArray: JobsTableParams[] = jobsResponse['jobs'];
    tableArray = this.convertJobsDatetimesToLocal(tableArray);
    this.dataSource = new MatTableDataSource(tableArray);
    this.sortTable();
  }

  sortTable() {
    /*
    Adds sorting feature to table columns.
    */
    this.dataSource.sort = this.sort;
  }

  cancelJob(rowData: JobsTableParams = null) {
    /*
    Handles job cancel event from "Run" and "Jobs" tab.
    */

    let batchJobStatus = new BatchStatus(); 

    if (rowData == null) {
      // "Run" tab - uses current job.
      batchJobStatus.job_id = this.currentJobStatus.job_id;
      batchJobStatus.job_status = this.currentJobStatus.job_status;
    }
    else {
      // "Jobs" tab - uses job from table.
      batchJobStatus.job_id = rowData.jobId;
      batchJobStatus.job_status = rowData.jobStatus;
    }

    if (this.finishedStates.includes(batchJobStatus.job_status)) {
      // Skips cancel request if job already finished.
      this.displayMessageDialog("Job is already complete");
      this.stopJobPolling();
      return;
    }

    this.makeCancelJobRequest(batchJobStatus, rowData);

  }

  makeCancelJobRequest(batchJobStatus: BatchStatus, rowData: JobsTableParams): void {
    /*
    Makes request to cancel user's active job.
    */
    this.loaderService.show();
    this.downloaderService.cancelBatchJob(batchJobStatus).subscribe(response => {
      this.loaderService.hide();
      this.status = response['status'];
      this.currentJobStatus.job_status = response['job_status'];
      this.displayMessageDialog(response['status']);
      this.stopJobPolling();
      if (rowData != null) {
        // Updates table job status if canceled from table.
        rowData.jobStatus = response['job_status'];
      }
    });
  }

  makeJobStartRequest(batchJob: BatchJob) {
    /*
    Kicks off batch/celery process via API.
    */
    this.loaderService.show();
    this.downloaderService.startBatchJob(batchJob).subscribe(response => {
      this.loaderService.hide();
      this.status = response['status'];
      this.currentInputFilename = this.uploadedFile.name;
      this.currentJobStatus.job_id = response['job_id'];
      this.currentJobStatus.job_status = response['job_status'];
      if ('job' in response) {
        this.currentJobStatus.job_num = response['job']['jobNum'];
      }
      if (!this.status.includes("Failed")) {
        this.pollJobStatus(this.currentJobStatus);
      }
    });
  }

  displayMessageDialog(message: string) {
    /*
    Displays dialog messages to user.
    */
    this.messageDialog.open(DialogComponent, {
      data: {
        dialogMessage: message
      }
    });
  }

  convertJobsDatetimesToLocal(jobsData: JobsTableParams[]) {
    /*
    Converts datetime values to local time for "Jobs" table.
    */
    jobsData.forEach(job => {
      job.receivedDatetime = this.convertDatetime(job.receivedDatetime);
      job.finishedDatetime = this.convertDatetime(job.finishedDatetime);
    });
    return jobsData;
  }

  convertDatetime(datetime: string) {
    /*
    Converts datetime string into local timezone.
    */
    if (datetime == 'None') {
      return datetime;
    }
    else {
      let utcFormattedDate = new Date(datetime + ' UTC');  // time in UTC from backend
      return this.datePipe.transform(utcFormattedDate, 'yyyy-MM-dd HH:mm:ss');
    }
  }

  updateTableJob(jobData: JobsTableParams) {
    /*
    Updates job info in "Jobs" table.
    */
    // Get row data from table using jobid:
    if (this.dataSource == null) {
      return;
    }

    this.dataSource.filteredData.some(rowData => {
      if (rowData.jobId == jobData.jobId) {
        // Updates job status and finished time of matching job id
        rowData.jobStatus = jobData.jobStatus;
        rowData.finishedDatetime = this.convertDatetime(jobData.finishedDatetime);
        return true;  // breaks out of iteration
      }
    });
  }

}
