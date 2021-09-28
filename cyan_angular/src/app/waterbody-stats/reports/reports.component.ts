import { Component, OnInit } from '@angular/core';

import { Location } from '../../models/location';
import { DownloaderService } from '../../services/downloader.service';
import { LocationService } from '../../services/location.service';
import { DialogComponent } from '../../shared/dialog/dialog.component';
import { LoaderService } from '../../services/loader.service';


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
  	'locations': 'User Locations',
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

	requestsTracker: number = 0;
  totalRequests: number = 0;

  constructor(
  	private downloader: DownloaderService,
  	private locationService: LocationService,
  	private dialog: DialogComponent,
  	private loaderService: LoaderService
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
		let countyId = this.findCountyId(event.value);
		console.log("County ID: ", countyId);
		this.selectedCounty = event.value;
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

	findCountyId(countyName) {
		/*
		Gets county ID from wbCounties list.
		*/
		let countyArray = this.wbCounties.filter(county => county[1] === countyName);
		if (countyArray.length < 1) {
			this.dialog.handleError("Couldn't find county ID. Try a different county.");
		}
		return countyArray[0];
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
  	
  }

}
