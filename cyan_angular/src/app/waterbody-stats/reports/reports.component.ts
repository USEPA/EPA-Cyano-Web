import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatRadioChange } from '@angular/material/radio';

import { Location } from '../../models/location';
import { DownloaderService } from '../../services/downloader.service';
import { LocationService } from '../../services/location.service';
import { DialogComponent } from '../../shared/dialog/dialog.component';
import { LoaderService } from '../../services/loader.service';
import { Calculations } from '../utils/calculations';
import { AuthService } from '../../services/auth.service';
import { ReportsResultsComponent } from './reports-results.component';
import { UserService } from '../../services/user.service';


@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {

 	reportTypeOptions: any = {
  	'objectids': 'User Locations',
  	'tribe': 'Tribe',
  	'county': 'County',
  }

	selectedReportType: string = '';

	wbTribes: string[] = [];  // list of available Tribes
	wbStates: string[] = [];  // list of available States
	wbCounties: string[] = [];  // list of available Counties (by state)
	myLocations: Location[] = [];  // list of locations from "My Locations"

	locationObj: any = {
		location: null,
		checked: false,
		availableDates: []
	};

	userLocations = [];  // list of user locations with checkbox status and location

	dates: string[] = [];  // dates selection for reports

	selectAll: boolean = false;
	selectedState: string = '';
	selectedCounty: string = '';
	selectedTribe: string = '';

	currentWaterbodyId: number = null;  // objectid, tribe id, or county id
	currentWaterbodyIds: number[] = [];

	waterbodyIds: any = {
		objectids: [],
	}

	requestsTracker: number = 0;
  totalRequests: number = 0;

  minDay: number = 0;  // min allowed day
  maxDay: number = 366; // max allowed day

  minYear: number = 1900;
  maxYear: number = 9999;

  selectedCalendarDate: Date = null;
  selectedDate: string;

  constructor(
  	private downloader: DownloaderService,
  	private locationService: LocationService,
  	private dialog: DialogComponent,
  	private loaderService: LoaderService,
  	private calcs: Calculations,
  	private authService: AuthService,
  	private matDialog: MatDialog,
  	public dialogRef: MatDialogRef<ReportsResultsComponent>,
  	@Inject(MAT_DIALOG_DATA) public data: any,
  	private userService: UserService
  ) { }

  ngOnInit(): void {
  	// this.loaderService.showProgressBar();
    // this.loaderService.show();
  // 	this.getTribes();
		// this.getStates();
  }

  ngOnDestroy(): void {
    this.stopJobPolling();
  }

	exit(): void {
    this.ngOnDestroy();
  }

	stopJobPolling(): void {
    console.log("Stopping job status polling.")
  }

  resetSelectedInputs() {
  	this.selectedTribe = '';
		this.selectedState = '';
		this.selectedCounty = '';
		this.currentWaterbodyIds = [];
		this.selectAllCheckbox({checked: false});  // unchecks all locations
		this.selectAll = false;  // unchecks select all box
  }

  onReportSelect(event): void {
  	this.selectedReportType = event.value;
  	this.resetSelectedInputs();
  	if (this.selectedReportType === 'objectids') {
  		this.getMyLocations();
  	}
  	else if (this.selectedReportType === 'tribe') {
  		this.getTribes();
  	}
  	else if (this.selectedReportType === 'county') {
  		this.getStates();
  	}
  }

  onTribeSelect(event): void {
  	console.log("onTribeSelect() called: ", event)
  	this.selectedTribe = event.value;
  	let tribeId = this.findIdByName(event.value, this.wbTribes);
  	this.currentWaterbodyIds = [parseInt(tribeId)];
  }

	onStateSelect(event): void {
		console.log("onStateSelect() called: ", event)
		this.selectedState = event.value
		// Gets all counties in the selected state:
		this.getCounties(this.selectedState);
	}

	onCountySelect(event): void {
		// Ready to generate report for the county after selected a date
		let countyId = this.findIdByName(event.value, this.wbCounties);
		this.selectedCounty = event.value;
		this.currentWaterbodyIds = [parseInt(countyId)];
	}

	getTribes() {
		if (this.wbTribes.length > 1) {
			return;
		}
		this.loaderService.show();
		this.downloader.getTribes().subscribe(response => {
			this.loaderService.hide();
			this.wbTribes = this.alphabetize(response['tribes']);
		});
	}

	getCounties(state: string) {
		this.loaderService.show();
		this.downloader.getCounties(state).subscribe(response => {
			this.loaderService.hide();
			this.wbCounties = this.alphabetize(response['counties']);
		});
	}

	getStates() {
		if (this.wbStates.length > 1) {
			return;
		}
		this.loaderService.show();
		this.downloader.getStates().subscribe(response => {
			this.loaderService.hide();
			this.wbStates = this.alphabetize(response['states']);
		});
	}

	getMyLocations() {
		this.loaderService.show();
		this.myLocations = this.locationService.getStaticLocations();
		this.myLocations.forEach(location => {
			if (
				!('waterbody' in location) ||
				!('objectid' in location['waterbody']) ||
				location['waterbody']['objectid'] == null
			) {
				return;
			}
			let locationObj = {};
			locationObj['location'] = location;
			locationObj['checked'] = false;
			this.userLocations.push(locationObj);
		});
		this.loaderService.hide();
	}

	updateDate(event) {
		console.log("updateDate() called: ", event)
		this.selectedDate = event;
	}

	selectAllCheckbox(event) {
		/*
		Checks/unchecks all locations in myLocations.
		*/
		console.log("selectAllCheckbox() called: ", event)
		this.userLocations.forEach(userLocation => {
				userLocation.checked = event.checked;
				if (event.checked === true) {
					this.currentWaterbodyIds.push(userLocation.location.objectid);
				}
				else {
					this.removeLocation(userLocation);
				}
		});
	}

	locationSelect(userLocation, event) {
		/*
		Event hanlder for checking a location in User Locations list.
		*/
		if (event.checked === true && this.currentWaterbodyIds.indexOf(userLocation.location.waterbody.objectid) === -1) {
			this.currentWaterbodyIds.push(userLocation.location.waterbody.objectid)
		}
		else if (event.checked === false) {
			this.removeLocation(userLocation);
		}
	}

	findIdByName(name: string, wbData) {
		let dataArray = wbData.filter(item => item[1] === name);
		if (dataArray.length < 1) {
			this.dialog.handleError("Couldn't find ID for " + name);
		}
		return dataArray[0];
	}

	removeLocation(userLocation) {
		/*
		Removes location from selectionLocations.
		*/
		this.userLocations.find((o, i) => {
			if (o.location.objectid == userLocation.location.objectid) {
				this.currentWaterbodyIds.splice(i);
				return;
			}
		});
	}

  generateReport(): void {
  	/*
  	Makes request to /report endpoint to try and
  	generate a report based on county, tribe, or "my location".
  	*/
  	let dayOfYear = this.calcs.getDayOfYearFromDateObject(this.selectedCalendarDate);
  	let year = parseInt(dayOfYear.split(' ')[0]);
  	let day = parseInt(dayOfYear.split(' ')[1]);

  	this.validateReportRequest(year, day);

  	let ranges = [
	  	this.userService.currentAccount.settings.level_low,
	  	this.userService.currentAccount.settings.level_medium,
	  	this.userService.currentAccount.settings.level_high
	  ];
  	
  	this.downloader.generateReport(this.selectedReportType, this.currentWaterbodyIds, dayOfYear, ranges).subscribe(response => {
  		if (response['status'] !== true) {
  			this.dialog.displayMessageDialog(response['status']);
  			return;
  		}
  		this.dialog.displayMessageDialog("Report is being generated. Select 'view reports' for more information.")
  	},
  	error => {
  		let errorMessage = error.error.status;
  		let reportId = error.error.report_id;
  		let reportStatus = error.error.report_status;
  		console.log("Error generating report : ", errorMessage, reportId, reportStatus);
  		if (errorMessage.length < 1) {
  			errorMessage = 'An unknown error occurred. Please try again.';
  		}
  		this.dialog.handleError(errorMessage);
  	});


  }

  validateReportRequest(year: number, day: number): void {
  	if (!Object.keys(this.reportTypeOptions).includes(this.selectedReportType)) {
      this.dialog.handleError('Report type is not valid.');
    }
    else if ((year > this.maxYear || year < this.minYear)) {
    	this.dialog.handleError('Year is out of range.');
    }
    else if (day > this.maxDay || day < this.minDay) {
    	this.dialog.handleError('Day is out of range. Must be between 1 - 366.');
    }
    else if (year.toString().length != 4) {
    	this.dialog.handleError('Year is wrong size. Must be 4 digits (e.g., 2021).');
    }
    else if (day.toString().length > 3 || day.toString().length < 1) {
    	this.dialog.handleError('Day is wrong size. Must be between 1 and 3 (e.g., 1 - 366).');
    }
    // TODO: Set limits on report ID array
  }

  viewReports() {
  	/*
  	Shows table of user's reports.
  	*/
  	if (!this.authService.checkUserAuthentication()) { return; }
    this.dialogRef = this.matDialog.open(ReportsResultsComponent, {
      maxWidth: '100%',
      data: {
      	username: this.userService.currentAccount.user.username
      }
      // panelClass: 'csv-dialog'
    });
  }

  alphabetize(stringArray) {
  	/*
  	Sorts lists alphabetically.
  	*/
  	return stringArray.sort((a, b) => a[1].localeCompare(b[1]))
  }

}
