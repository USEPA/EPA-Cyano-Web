import { Component, OnInit, Inject, ViewChild} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DataSource } from '@angular/cdk/table';
import { DatePipe } from '@angular/common';

import { DialogComponent } from '../../shared/dialog/dialog.component';
import { DownloaderService } from '../../services/downloader.service';
import { 
  // BatchJob,
  // BatchLocation,
  ReportStatus,
  ReportsTableParams,
  columnNames,
  // csvKeys
} from '../../models/reports';
import { LoaderService } from '../../services/loader.service';
import { Calculations } from '../utils/calculations';


@Component({
  selector: 'app-reports-results',
  templateUrl: './reports-results.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsResultsComponent implements OnInit {

  username: string = '';
  dataSource;
  finishedStates: string[] = ['FAILURE', 'REVOKED', 'SUCCESS'];
  inProgressStates: string[] = ['RETRY', 'PENDING', 'RECEIVED', 'STARTED'];
  displayedColumns: string[] = [];
  columnNames: any[] = columnNames;

  @ViewChild(MatSort) sort: MatSort;
  
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    @Inject(MatDialogRef) public dialogRef: any,
    private dialog: DialogComponent,
    private downloaderService: DownloaderService,
    private datePipe: DatePipe,
    private loaderService: LoaderService,
    private calcs: Calculations
  ) { }

  ngOnInit(): void {

    console.log("reports-results ngOnInit()")

    this.username = this.data.username;

    this.displayedColumns = this.columnNames.map(x => x.id);

    // Gets user reports for reports table:
    this.getAllUserReports();

  }

  ngOnDestroy(): void {

  }

  exit(): void {
    console.log("exit() called.")
    this.ngOnDestroy();
    this.dialogRef.close();
  }

  getAllUserReports() {
    this.downloaderService.getUserReports().subscribe(response => {

      console.log("All user reports response: ", response)


      if (response['status'] == false) {
        this.dialog.displayMessageDialog("Cannot display user reports");
      }
      this.createTable(response);
    });
  }

  createTable(reportsResponse): void {
    /*
    Creates table object in "Jobs" tab.
    */
    // let tableArray: ReportsTableParams[] = reportsResponse['reports'];
    let tableArray = reportsResponse['reports'];
    tableArray = this.convertJobsDatetimesToLocal(tableArray);

    console.log("Table array: ", tableArray)

    this.dataSource = new MatTableDataSource(tableArray);
    this.sortTable();
  }

  sortTable() {
    /*
    Adds sorting feature to table columns.
    */
    this.dataSource.sort = this.sort;
  }

  convertJobsDatetimesToLocal(reportsData) {
    /*
    Converts datetime values to local time for "Jobs" table.
    */
    reportsData.forEach(report => {
      report.received_datetime = this.convertDatetime(report.received_datetime);
      report.finished_datetime = this.convertDatetime(report.finished_datetime);
      report.report_date = this.calcs.getDateFromDayOfYear(report.report_date)

      if (report.report_status === 'SUCCESS') {
        console.log("Successful report, adding download button.")
        report['download_report'] = '<mat-icon>file_download</mat-icon>';
      }

    });
    return reportsData;
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

  downloadReport(reportData) {
    /*
    Downloads report from WB API.
    */
    console.log("downloadReport() called: ", reportData);
    let dialogRef = this.dialog.displayMessageDialog('Download report?');
    dialogRef.afterClosed().subscribe(response => {
      if (response !== true) {
        return;
      }
      this.loaderService.show();
      this.downloaderService.downloadReport(reportData.report_id).subscribe(response => {
        this.loaderService.hide();
        console.log("downloadReport response: ", response);

        // Downloads report as PDF:
        let pdfBlob = response.body;
        let downloadUrl = window.URL.createObjectURL(pdfBlob);
        let link = document.createElement('a');
        link.href = downloadUrl;
        link.download = reportData.report_id;  // uses report ID for filename
        link.click();

      });
    });
  }

  // cancelJob(rowData: JobsTableParams = null) {
  //   /*
  //   Handles job cancel event from "Run" and "Jobs" tab.
  //   */

  //   let batchJobStatus = new BatchStatus(); 

  //   if (rowData == null) {
  //     // "Run" tab - uses current job.
  //     batchJobStatus.job_id = this.currentJobStatus.job_id;
  //     batchJobStatus.job_status = this.currentJobStatus.job_status;
  //   }
  //   else {
  //     // "Jobs" tab - uses job from table.
  //     batchJobStatus.job_id = rowData.jobId;
  //     batchJobStatus.job_status = rowData.jobStatus;
  //   }

  //   if (this.finishedStates.includes(batchJobStatus.job_status)) {
  //     // Skips cancel request if job already finished.
  //     this.displayMessageDialog("Job is already complete");
  //     this.stopJobPolling();
  //     return;
  //   }

  //   this.makeCancelJobRequest(batchJobStatus, rowData);

  // }

  // makeCancelJobRequest(batchJobStatus: BatchStatus, rowData: JobsTableParams): void {
  //   /*
  //   Makes request to cancel user's active job.
  //   */
  //   this.loaderService.show();
  //   this.downloaderService.cancelBatchJob(batchJobStatus).subscribe(response => {
  //     this.loaderService.hide();
  //     this.status = response['status'];
  //     this.currentJobStatus.job_status = response['job_status'];
  //     this.displayMessageDialog(response['status']);
  //     this.stopJobPolling();
  //     if (rowData != null) {
  //       // Updates table job status if canceled from table.
  //       rowData.jobStatus = response['job_status'];
  //     }
  //   });
  // }

  // makeJobStartRequest(batchJob: BatchJob) {
  //   /*
  //   Kicks off batch/celery process via API.
  //   */
  //   this.loaderService.show();
  //   this.downloaderService.startBatchJob(batchJob).subscribe(response => {
  //     this.loaderService.hide();
  //     this.status = response['status'];
  //     this.currentInputFilename = this.uploadedFile.name;
  //     this.currentJobStatus.job_id = response['job_id'];
  //     this.currentJobStatus.job_status = response['job_status'];
  //     if ('job' in response) {
  //       this.currentJobStatus.job_num = response['job']['jobNum'];
  //     }
  //     if (!this.status.includes("Failed")) {
  //       this.pollJobStatus(this.currentJobStatus);
  //     }
  //   });
  // }

}