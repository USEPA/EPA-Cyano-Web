import { Component, OnInit } from '@angular/core';

import { Location } from '../../models/location';
import { DownloaderService } from '../../services/downloader.service';
import { LocationService } from '../../services/location.service';
import { DialogComponent } from '../../shared/dialog/dialog.component';
import { LoaderService } from '../../services/loader.service';
import { Calculations } from '../utils/calculations';


@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {

	// reportTypeOptions: any = {
 //  	'tribe': 'Tribe',
 //  	'county': 'County',
 //  	'state': 'State'
 //  }
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
	}

	userLocations = [];  // list of user locations with checkbox status and location

	dates: string[] = [];  // dates selection for reports

	selectAll: boolean = false;
	selectedState: string = '';
	selectedCounty: string = '';
	selectedTribe: string = '';
	selectedLocations = [];

	currentReportId: number = null;  // objectid, tribe id, or county id

	requestsTracker: number = 0;
  totalRequests: number = 0;

  minDay: number = 0;  // min allowed day
  maxDay: number = 366; // max allowed day

  minYear: number = 1900;
  maxYear: number = 9999;

  selectedCalendarDate: Date = null;

  constructor(
  	private downloader: DownloaderService,
  	private locationService: LocationService,
  	private dialog: DialogComponent,
  	private loaderService: LoaderService,
  	private calcs: Calculations
  ) { }

  ngOnInit(): void {
  	this.loaderService.showProgressBar();
    this.loaderService.show();
  	this.getTribes();
		this.getStates();
		this.getMyLocations();
  }

  resetSelectedInputs() {
  	this.selectedTribe = '';
		this.selectedState = '';
		this.selectedCounty = '';
		this.selectedLocations = [];
		this.selectAllCheckbox({checked: false});  // unchecks all locations
		this.selectAll = false;  // unchecks select all box
  }

  onReportSelect(event): void {
  	console.log("onReportSelect() called: ", event)
  	this.selectedReportType = event.value;
  	this.resetSelectedInputs();

  	// TODO: Make requests for the report type when selected instead
  	// of at ngOnInit().

  }

  onTribeSelect(event): void {
  	console.log("onTribeSelect() called: ", event)
  	this.selectedTribe = event.value;
  	let tribeId = this.findIdByName(event.value, this.wbTribes);
  	this.currentReportId = parseInt(tribeId);
  }

	onStateSelect(event): void {
		console.log("onStateSelect() called: ", event)
		this.selectedState = event.value
		// Gets all counties in the selected state:
		this.getCounties(this.selectedState);
	}

	onCountySelect(event): void {
		console.log("onCountySelect() called: ", event)
		// Ready to generate report for the county after selected a date
		let countyId = this.findIdByName(event.value, this.wbCounties);
		console.log("County ID: ", countyId);
		this.selectedCounty = event.value;
		this.currentReportId = parseInt(countyId);
	}

	getTribes() {
		this.incrementRequest();
		this.downloader.getTribes().subscribe(response => {
			this.updateProgressBar();
			console.log("getTribes() response: ", response)
			this.wbTribes = response['tribes'];
		});
	}

	getCounties(state: string) {
		this.loaderService.show();
		this.downloader.getCounties(state).subscribe(response => {
			this.loaderService.hide();
			console.log("getCounties() response: ", response)
			this.wbCounties = response['counties'];
		});
	}

	getStates() {
		this.incrementRequest();
		this.downloader.getStates().subscribe(response => {
			this.updateProgressBar();
			console.log("getStates() response: ", response)
			this.wbStates = response['states'];
		});
	}

	getMyLocations() {
		this.incrementRequest();
		this.myLocations = this.locationService.getStaticLocations();
		this.myLocations.forEach(location => {
			let locationObj = {};
			locationObj['location'] = location;
			locationObj['checked'] = false;
			this.userLocations.push(locationObj);
		});
		this.updateProgressBar();
	}

	updateDate(event) {
		console.log("updateDate() called: ", event)
	}

	selectAllCheckbox(event) {
		/*
		Checks/unchecks all locations in myLocations.
		*/
		console.log("selectAllCheckbox() called: ", event)
		this.userLocations.forEach(userLocation => {
				userLocation.checked = event.checked;
				if (event.checked === true) {
					this.selectedLocations.push(userLocation);	
				}
				else {
					this.removeLocation(userLocation);
				}
		});
		console.log("selected locations: ", this.selectedLocations)
	}

	locationSelect(userLocation, event) {
		/*
		Event hanlder for checking a location in User Locations list.
		*/
		if (event.checked === true) {
			this.selectedLocations.push(userLocation);
		}
		else {
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
			if (o.location.name == userLocation.location.name) {
				this.selectedLocations.splice(i);
				return;
			}
		});
	}

	incrementRequest() {
		console.log("incrementRequest called")
    this.requestsTracker++;
    this.totalRequests++;
  }

  updateProgressBar(): void {
  	console.log("updateProgressBar called")
    this.requestsTracker--;
    let progressValue = 100 * (1 - (this.requestsTracker / this.totalRequests));
    this.loaderService.progressValue.next(progressValue);
    if (this.requestsTracker <= 0) {
      this.loaderService.hide();
      this.loaderService.progressValue.next(0);
    }
  }

  generateReport(): void {
  	/*
  	Makes request to /report endpoint to try and
  	generate a report based on county, tribe, or "my location".
  	*/
  	console.log("generateReport() called.")

  	let day = this.selectedCalendarDate.getDay();
  	let year = this.selectedCalendarDate.getFullYear();

  	this.validateReportRequest(year, day);

  	// TODO: Set currentReportID for User Locations report type
  	
  	this.downloader.generateReport(this.selectedReportType, this.currentReportId, year, day).subscribe(response => {
  		console.log("generateReport response: ", response)
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

}
