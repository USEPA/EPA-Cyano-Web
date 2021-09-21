import { Component, OnInit } from '@angular/core';

import { Location } from '../../models/location';
import { DownloaderService } from '../../services/downloader.service';
import { LocationService } from '../../services/location.service';
import { DialogComponent } from '../../shared/dialog/dialog.component';


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

	userLocations = [];

	dates: string[] = [];  // dates selection for reports

	selectAll: boolean = false;
	selectedState: string = '';
	selectedCounty: string = '';
	selectedTribe: string = '';


  constructor(
  	private downloader: DownloaderService,
  	private locationService: LocationService,
  	private dialog: DialogComponent
  ) { }

  ngOnInit(): void {
  	this.getTribes();
		// this.getCounties();
		this.getStates();
		this.getMyLocations();
  }

  onReportSelect(event): void {
  	console.log("onReportSelect() called: ", event)
  	this.selectedReportType = event.value;
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

	onLocationsSelect(event): void {
		console.log("onLocationsSelect() called: ", event)

		// Show list of user's "My Locations" with all of them checked.
		// Have select/deselect all option at top of list.



	}

	onCountySelect(event): void {
		console.log("onCountySelect() called: ", event)
		// Ready to generate report for the county after selected a date
		let countyId = this.findCountyId(event.value);
		console.log("County ID: ", countyId);
	}

	getTribes() {
		this.downloader.getTribes().subscribe(response => {
			console.log("getTribes() response: ", response)
			this.wbTribes = response['tribes'];
		});
	}

	getCounties(state: string) {
		this.downloader.getCounties(state).subscribe(response => {
			console.log("getCounties() response: ", response)
			this.wbCounties = response['counties'];
		});
	}

	getStates() {
		this.downloader.getStates().subscribe(response => {
			console.log("getStates() response: ", response)
			this.wbStates = response['states'];
		});
	}

	getMyLocations() {
		this.myLocations = this.locationService.getStaticLocations();
		this.myLocations.forEach(location => {
			this.userLocations['location'] = location;
			this.userLocations['checked'] = true;
		});
	}

	parseResults(resultType: string) {

	}

	updateDate(event) {
		console.log("updateDate() called: ", event)
	}

	selectAllCheckbox(event) {
		console.log("selectAllCheckbox() called: ", event)
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

}
