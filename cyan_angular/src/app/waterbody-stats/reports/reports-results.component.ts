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
import { AuthService } from '../../services/auth.service';


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
  status: string = '';  // job status
  pollStatusDelay: number = 2000;  // milliseconds
  intervalProcess: ReturnType<typeof setInterval>;  // keeps track of status polling
  currentJobStatus: ReportStatus;

  @ViewChild(MatSort) sort: MatSort;
  
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    @Inject(MatDialogRef) public dialogRef: any,
    private dialog: DialogComponent,
    private downloaderService: DownloaderService,
    private datePipe: DatePipe,
    private loaderService: LoaderService,
    private calcs: Calculations,
    private authService: AuthService
  ) { }

  ngOnInit(): void {

    console.log("reports-results ngOnInit()")

    this.currentJobStatus = new ReportStatus();

    this.username = this.data.username;

    this.displayedColumns = this.columnNames.map(x => x.id);

    // Gets user reports for reports table:
    this.getAllUserReports();

  }

  ngOnDestroy(): void {
    this.stopJobPolling();
  }

  exit(): void {
    console.log("exit() called.")
    this.ngOnDestroy();
    this.dialogRef.close();
  }

  stopJobPolling(): void {
    console.log("Stopping job status polling.")
    clearInterval(this.intervalProcess);
  }

  getAllUserReports() {
    this.downloaderService.getUserReports().subscribe(response => {

      console.log("All user reports response: ", response)

      if (response['status'] == false) {
        this.dialog.displayMessageDialog("Cannot display user reports");
      }
      
      this.createTable(response);

      let inProgressReports = response['reports'].filter(item => {
        console.log("Item and its status: ", item, item.report_status);
        return this.inProgressStates.includes(item.report_status)
      });
      console.log("In progress reports from table: ", inProgressReports);

      // NOTE: Should be only one item. If more than one, display error and cancel reports.
      // Should also be the first item in the array that's "RECEIVED".
      if (inProgressReports.length === 1) {
        let reportStatus = new ReportStatus();
        let inProgressReport = inProgressReports[0];
        reportStatus.report_id = inProgressReport.report_id;
        reportStatus.report_status = inProgressReport.report_status;
        reportStatus.report_num = inProgressReport.report_num;
        this.pollJobStatus(reportStatus);
      }


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

  createReportsTableParams(): void {

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
      report = this.addDownloadButton(report);
    });
    return reportsData;
  }

  addDownloadButton(report) {
    /*
    Adds download button for successful reports.
    */
    if (report.report_status === 'SUCCESS') {
      console.log("Successful report, adding download button.")
      report['download_report'] = '<mat-icon>file_download</mat-icon>';
    }

    return report;

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

  cancelReport(rowData: ReportsTableParams = null) {
    /*
    Handles job cancel event from "Run" and "Jobs" tab.
    */


    console.log("cancelReport called: ", rowData)


    let reportJobStatus = new ReportStatus(); 
    reportJobStatus.report_id = rowData.report_id;
    reportJobStatus.report_status = rowData.report_status;

    if (this.finishedStates.includes(reportJobStatus.report_status)) {
      // Skips cancel request if job already finished.
      this.dialog.displayMessageDialog("Job is already complete");
      this.stopJobPolling();
      return;
    }

    this.makeCancelJobRequest(reportJobStatus, rowData);

  }

  makeCancelJobRequest(reportJobStatus: ReportStatus, rowData: ReportsTableParams): void {
    /*
    Makes request to cancel user's active job.
    */
    // this.loaderService.show();
    this.downloaderService.cancelReportRequest(reportJobStatus.report_id).subscribe(response => {
      // this.loaderService.hide();
      this.status = response['status'];
      reportJobStatus.report_status = response['job_status'];
      this.dialog.displayMessageDialog(response['status']);
      this.stopJobPolling();
      if (rowData != null) {
        // Updates table job status if canceled from table.
        rowData.report_status = response['report_status'];
      }
    });
  }

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

  pollJobStatus(reportStatus: ReportStatus): void {
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
      this.downloaderService.getReportStatus(reportStatus.report_id).subscribe(response => {

        console.log("Report status from polling: ", response);

        if (response['status'].length > 0) {
          this.status = response['status'];
        }

        // Updates "Run" tab info
        this.currentJobStatus.report_id = response['report_id'];
        this.currentJobStatus.report_status = response['report_status'];

        // Updates "Jobs" tab info
        this.updateTableJob(response['report']);

        if (
          response['status'].includes("Failed")
          || this.finishedStates.includes(response['report_status'])
        ) {
          // Stops if job failed or is in a finished state.
          this.stopJobPolling();
          return;
        }

      });
    }, this.pollStatusDelay);
  }

  updateTableJob(reportData: ReportsTableParams) {
    /*
    Updates job info in "Jobs" table.
    */
    // Get row data from table using jobid:

    console.log("Updating job in table: ", reportData)

    if (this.dataSource == null) {
      return;
    }

    this.dataSource.filteredData.some(rowData => {
      console.log("rowData id: ", rowData.report_id);
      console.log("reportData id: ", reportData.report_id);
      if (rowData.report_id == reportData.report_id) {
        // Updates job status and finished time of matching job id
        rowData.report_status = reportData.report_status;
        rowData.finished_datetime = this.convertDatetime(reportData.finished_datetime);
        return true;  // breaks out of iteration
      }
    });
  }

}