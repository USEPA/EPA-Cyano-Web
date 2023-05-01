import { Component, OnInit } from '@angular/core';

import { DownloaderService } from '../../services/downloader.service';
import { LoaderService } from '../../services/loader.service';
import { DialogComponent } from '../../shared/dialog/dialog.component';

@Component({
  selector: 'app-monthly-reports',
  templateUrl: './monthly-reports.component.html',
  styleUrls: ['./monthly-reports.component.css']
})
export class MonthlyReportsComponent implements OnInit {

  selectedReportType: string = '';
  reportTypes: string[] = ['state', 'alpine'];
  states: string[] = [];  // list of available States
  availableDates: string[] = [];  // list of available dates (YYYY-MM)
  selectedState: string = '';  // e.g., alpine, NC, TX, etc.
  selectedDate: string;

  constructor(
    private loaderService: LoaderService,
    private downloader: DownloaderService,
    private dialog: DialogComponent,
  ) { }

  ngOnInit(): void {
  }

  resetSelectedInputs() {
    /*
    Resets inputs.
    */
    this.selectedState = '';
    this.selectedDate = '';
    this.availableDates = [];
  }

  onReportTypeSelect(event): void {

    this.resetSelectedInputs();
    this.selectedReportType = event.value;

    if (!this.reportTypes.includes(this.selectedReportType)) {
      console.error("Unrecognized report type.");
      return;
    }

    if (this.selectedReportType === 'state') {
      this.getStates();
    }
    else if (this.selectedReportType === 'alpine') {
      this.selectedState = 'alpine';
      this.downloader.getAvailableMonthlyReports(this.selectedReportType).subscribe(result => {
        this.getAvailableDates(result);
      });
    }
  }

  getStates() {
    if (this.states.length > 1) {
      return;
    }
    this.loaderService.show();
    this.downloader.getStates().subscribe(response => {
      this.loaderService.hide();
      this.states = this.alphabetize(response['states']);
    });
  }

  onStateSelect(stateName: string) {
    // TODO: Ensure expected format, type, etc.

    if (!this.validateState(stateName)) {
      return;
    }

    this.selectedState = this.getStateAbbreviation(stateName);

    if (!this.selectedState) {
      return;
    }

    // Get available dates for the selected state.
    this.downloader.getAvailableMonthlyReports(this.selectedState).subscribe(result => {
      this.getAvailableDates(result);
    });

  }

  onDateSelect(value) {
    // TODO: Ensure expected format, type, etc.
    if (!(typeof value === 'string')) {
      console.error("Date must be a string.");
      return;
    }
    else if (value.length !== 7 && value.length !== 6) {
      console.error("Date must be 6 or 7 characters long");
    }
    this.selectedDate = value;
  }

  getReport() {
    /*
    Gets state or alpine report by year and month.
    */
    let year = parseInt(this.selectedDate.split('-')[0]);
    let month = parseInt(this.selectedDate.split('-')[1]);

    this.loaderService.show();
    this.downloader.downloadMonthlyReport(this.selectedState, year, month).subscribe(response => {
      this.loaderService.hide();
      let filenameArray = response.headers.get('Content-Disposition').split("filename=");
      let filename = filenameArray[filenameArray.length - 1];

      console.log("Filename: ", filename);

      // Downloads report as PDF:
      let pdfBlob = response.body;
      let downloadUrl = window.URL.createObjectURL(pdfBlob);
      let link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;  // uses report ID for filename
      link.click();
    });

  }

  alphabetize(stringArray) {
    /*
    Sorts lists alphabetically.
    */
    return stringArray.sort((a, b) => a[1].localeCompare(b[1]))
  }

  getAvailableDates(reports) {
    /*
    Returns list of dates from list of available reports by
    parsing the reponse from /waterbody/report/state.
    */
    if (!('reports' in reports)) {
      console.error("'reports' not in result.");
      return;
    }
    if (reports['reports'].length <= 0) {
      console.error("reports list is < 1.");
      this.dialog.displayMessageDialog("No reports found for " + this.selectedState);
      return;
    }
    reports['reports'].forEach(report => {
      let state = report[0];
      let year = report[1];
      let month = report[2];
      let availableDate = year.toString() + '-' + month.toString();
      this.availableDates.push(availableDate);
    })

  }

  getStateAbbreviation(stateName: string) {
    /*
    Returns state abbreviation from state array.
    Ex: [["Alabama", "AL"], ["Texas", "TX"], ...]
    */
    if (this.states.length < 1) {
      console.error("States array is not initialized.");
      return;
    }
    return this.states.find(stateArray => stateArray[0] === stateName)[1];
  }

  validateState(stateName: string) {
    /*
    Ensures that the state is valid.
    */
    if (this.states.length < 1) {
      console.error("States array is not initialized.");
      return;
    }

    let stateIndex = this.states.indexOf(this.states.find(stateArray => stateArray[0] === stateName));

    if (stateIndex < 0) {
      console.error("State name is not recognized.")
      return;
    }

    return true;

  }

}
