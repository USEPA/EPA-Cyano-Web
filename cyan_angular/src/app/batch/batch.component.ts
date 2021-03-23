import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { AuthService } from '../services/auth.service';
import { DownloaderService } from '../services/downloader.service';

import { BatchJob, BatchLocation, BatchStatus } from '../models/batch';


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
  status: string = '';  // job status
  pollStatusDelay: number = 5000;  // milliseconds
  intervalProcess: ReturnType<typeof setInterval>;  // keeps track of status polling
  batchStatus: BatchStatus = new BatchStatus();
  currentInputFilename: string = '';
  finishedStates: string[] = ['FAILURE', 'REVOKED', 'SUCCESS'];
  inProgressStates: string[] = ['RETRY', 'PENDING', 'RECEIVED', 'STARTED'];

  constructor(
    public dialogRef: MatDialogRef<BatchComponent>,
    private authService: AuthService,
    private downloaderService: DownloaderService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.status = '';
    this.uploadedFile = null;
    this.currentInputFilename = '';
    clearInterval(this.intervalProcess);
  }

  exit(): void {
    this.dialogRef.close();
    this.ngOnDestroy();
  }

  pollJobStatus(batchStatus: BatchStatus): void {
    /*
    Polling loop that checks on user's job status.
    */
    console.log("Starting job status polling.")
    this.intervalProcess = setInterval(() => {
      this.downloaderService.getBatchStatus(batchStatus).subscribe(response => {
        console.log("Batch status response.");
        if (response['status'].length > 0) {
          this.status = response['status'];
        }
        if (this.finishedStates.includes(this.batchStatus.job_status)) {
          console.log("Stopping job status polling.")
          clearInterval(this.intervalProcess);
        }
        this.batchStatus.job_id = response['job_id'];
        this.batchStatus.job_status = response['job_status'];
      });
    }, this.pollStatusDelay);
  }

  validateUploadedFile(event): any {
    /*
    Validates user-uploaded CSV file.
    */
    let uploadedFile = event.target.files[0];

    if (uploadedFile === undefined || uploadedFile.length <= 0) {
      return {"error": "Error uploading file."};
    }

    let fileExtension = uploadedFile.name.split(".").splice(-1)[0];

    if (fileExtension != this.acceptedType) {
      return {"error": "File is not of type CSV."};
    }

    return uploadedFile;
  }

  validateFileContent(fileContent) {
    /*
    TODO
    */
    return fileContent;
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
      batchLocation.lat = parseFloat(rowArray[0]);
      batchLocation.lon = parseFloat(rowArray[1]);
      batchLocation.type = this.cleanString(rowArray[2]);  // weekly/daily
      batchLocations.push(batchLocation);
    });
    return batchLocations;
  }

  uploadFile(event): void {
    /*
    Uploads CSV file of locations for data processing.
    */
    if (!this.authService.checkUserAuthentication()) { return; }
    let file = this.validateUploadedFile(event);
    if ("error" in file) {
      this.status = file.error;
      this.uploadedFile = null;
      return;
    }
    else {
      this.uploadedFile = file;
    }

    let reader = new FileReader();
    reader.onload = (e) => {
      let csvContent: string = this.validateFileContent(reader.result);
      let locationObjects: BatchLocation[] = this.createBatchLocations(csvContent);
      let batchJob: BatchJob = new BatchJob();
      batchJob.filename = this.uploadedFile.name;  // TODO: Validate/sanitize filename
      batchJob.locations = locationObjects;

      this.currentInputFilename = this.uploadedFile.name;

      // Kicks off batch/celery process via API:
      this.downloaderService.startBatchJob(batchJob).subscribe(response => {
        console.log(response);
        this.status = response['status'];
        this.batchStatus.job_id = response['job_id'];
        this.batchStatus.job_status = response['job_status'];
        console.log("Initiating polling of job status.");
        this.pollJobStatus(this.batchStatus);
      });

    }
    reader.readAsText(this.uploadedFile);
  }

}
