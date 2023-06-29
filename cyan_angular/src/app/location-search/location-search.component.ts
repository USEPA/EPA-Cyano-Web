import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { LatLng } from 'leaflet';
import { MatDialog } from '@angular/material/dialog';

import { LocationResult } from './location-result';
import { Location } from '../models/location';
import { DownloaderService } from '../services/downloader.service';
import { MapService } from '../services/map.service';
import { DialogComponent } from '../shared/dialog/dialog.component';
import { LocationService } from '../services/location.service';
import { AuthService } from '../services/auth.service';

@Component({
	selector: 'app-location-search',
	templateUrl: './location-search.component.html',
	styleUrls: ['./location-search.component.css']
})
export class LocationSearchComponent implements OnInit {

	apiUrl: string = "https://nominatim.openstreetmap.org/search"
	downloaderSub: Subscription;
	enteredLocation: string = "";  // user-entered location
	locationResults: LocationResult[] = [];  // list of location results
	zoomLevel: number = 12;  // zoom level when selecting location
	showLocationSearch: boolean = true;
	withinUSKeyword: string = "United States";  // string to determine if result is within conus US

	selectedSearchMethod: string = '';

	showNameSearch: boolean = false;
	showCoordsSearch: boolean = false;

	// Variables from coordinates component:
	// +++++++++++++++++++++++++++++++++++++
	marked: string = 'Check';

	selectedLat: string = 'N';
	selectedLon: string = 'W';

	northLat: number = 53; // north lat
	westLon: number = -130; // west long
	eastLon: number = -65; // east long
	southLat: number =  24; // south lat

	latDeg: number;
	latMin: number;
	latSec: number;

	lonDeg: number;
	lonMin: number;
	lonSec: number;

	latDec: number;  // decimal degrees
	lonDec: number;  // decimal degrees

	location: Location;

	units: object = {dms: "Degree-Minute-Seconds", dd: "Decimal Degrees"};
	defaultSelected: string = "dms";
	selectedKey: string = "dms";  // dms or dd

	showCoords: boolean = true;  // bool for displaying coordinates component

	// +++++++++++++++++++++++++++++++++++++


	constructor(
		private downloader: DownloaderService,
		private mapService: MapService,
		private dialogComponent: DialogComponent,
		private errorDialog: MatDialog,
		private locationService: LocationService,
		private authService: AuthService
	) { }

	ngOnInit(): void {
		this.showLocationSearch = true;
	}

	searchLocation() {
		let urlQuery = encodeURI(this.apiUrl + "?q=" + this.enteredLocation + "&format=json&country=us");
		if (this.downloaderSub) {
			this.downloaderSub.unsubscribe();
		}
		this.downloaderSub = this.downloader.executeAuthorizedGetRequest(urlQuery).subscribe(response => {
			this.locationResults = this.createLocationResults(response);
		});
	}

	createLocationResults(response: any): LocationResult[] {
		let locationResults = [];
		for(let index in response) {
			let responseItem = response[index];
			if (!this.inUnitedStates(responseItem)) {
				continue;
			}
			let locationResult = new LocationResult;
			locationResult.place_id = responseItem['place_id'];
			locationResult.licence = responseItem['licence'];
			locationResult.osm_type = responseItem['osm_type'];
			locationResult.osm_id = responseItem['osm_id'];
			locationResult.boundingbox = responseItem['boundingbox'];
			locationResult.lat = responseItem['lat'];
			locationResult.lon = responseItem['lon'];
			locationResult.display_name = responseItem['display_name'];
			locationResult.class = responseItem['class'];
			locationResult.type = responseItem['type'];
			locationResult.importance = responseItem['importance'];
			locationResult.icon = responseItem['icon'];
			locationResults.push(locationResult);
		}

		console.log("locationResults: ", locationResults)

		return locationResults;
	}

	viewLocation(location) {
		/*
		Pans map to location.
		*/
		let map = this.mapService.getMap();
		let latLon = new LatLng(Number(location.lat), Number(location.lon));
		let latLonArray = [];
		latLonArray.push(latLon)
		map.flyToBounds(latLonArray, {'maxZoom': this.zoomLevel});
		this.handleComponentDisplay();
	}

	inUnitedStates(locationResult: LocationResult): boolean {
		/*
		Checks if location is in United States.
		NOTE: API has "country=" param, but doesn't seem to be working.
		Test Example: https://nominatim.openstreetmap.org/search?q=deer%20lake&format=json&country=us
		API Docs: https://nominatim.org/release-docs/develop/api/Search/
		*/
		if (!locationResult.display_name.includes(this.withinUSKeyword)) {
			return false;
		}
		return true;
	}

	handleComponentDisplay(): void {
		/*
		Removes location-search component when "viewLocation"
		is selected for small screens.
		*/
		if (window.innerWidth <= 500) {
			this.showLocationSearch = false;
		}
		else {
			this.showLocationSearch = true;
		}
	}

	updateSearchMethod(event): void {

		console.log("updateSearchMethod() called: ", event);

		if (event == 'locationName') {
			this.showNameSearch = true;
			this.showCoordsSearch = false;
		}
		else if (event == 'coordinates') {
			this.showCoordsSearch = true;
			this.showNameSearch = false;
		}
		

	}


	// Coordinates component section:
	// ++++++++++++++++++++++++++++++++++

	markLocation(): void {
		if (!this.authService.checkUserAuthentication()) {
			return;
		}
		if (!this.validateCoords(this.selectedKey)) {
			this.displayError("Coordinates are not within CONUS");
			return;
		}
		this.location = this.getLocationData();
		this.locationService.setMarked(this.location, true);
		this.mapService.updateMarker(this.location);
		this.locationService.updateLocation(this.location.name, this.location);
		this.handleComponentDisplay();
	}

	compareLocation(): void {
		if (!this.authService.checkUserAuthentication()) {
			return;
		}
		if (!this.validateCoords(this.selectedKey)) {
			this.displayError("Coordinates are not within CONUS");
			return;
		}
		this.location = this.getLocationData();
		this.locationService.addCompareLocation(this.location);
		this.handleComponentDisplay();
	}

	getLocationData(): Location {
		/*
		requestType: 'compare' or 'mark'
		*/

		let map = this.mapService.getMap();

		let name = 'To Be Updated...';
		let cellCon = 0;
		let maxCellCon = 0;
		let cellChange = 0;
		let dataDate = '01/01/2018';
		let source = 'OLCI';
		let location: Location = new Location();
		location.latitude_deg = this.latDeg;
		location.latitude_min = this.latMin;
		location.latitude_sec = this.latSec;
		location.latitude_dir = this.selectedLat;
		location.longitude_deg = this.lonDeg;
		location.longitude_min = this.lonMin;
		location.longitude_sec = this.lonSec;
		location.longitude_dir = this.selectedLon;

		let latLon = null;
		if (this.selectedKey == "dms") {
			latLon = this.mapService.getLatLng(location);
		}
		else {
			latLon = new LatLng(this.latDec, this.lonDec);
		}

		location = this.locationService.createLocation(name, latLon.lat, latLon.lng, cellCon, maxCellCon, cellChange, dataDate, source);

		map.setView(latLon, 12);
		let m = this.mapService.addMarker(location);
		m.fireEvent('click');

		return location;
	}

	onSelect(selectedValue: any): void {

		let validCoords = this.validateCoords(this.selectedKey);  // check if existing coords to convert

		this.selectedKey = selectedValue.value;  // sets active coord type (dd or dms)

		if (validCoords !== true) {
			return;
		}

		if (this.selectedKey === 'dms') {
			let dmsCoords = this.mapService.convertDdToDms(this.latDec, this.lonDec);
			this.latDeg = dmsCoords[0][0];
			this.latMin = dmsCoords[0][1];
			this.latSec = dmsCoords[0][2];
			this.lonDeg = dmsCoords[1][0];
			this.lonMin = dmsCoords[1][1];
			this.lonSec = dmsCoords[1][2];
		}
		else if (this.selectedKey === 'dd') {
			let ddCoords = this.mapService.convertDmsToDd(this.latDeg, this.latMin, this.latSec, this.selectedLat, this.lonDeg, this.lonMin, this.lonSec, this.selectedLon);
			this.latDec = ddCoords[0];
			this.lonDec = ddCoords[1];
		}

	}

	validateCoords(coordType: string): boolean {
		/*
		Checks whether coordinates are within CONUS.
		*/
		let latLon = [];
		let latLonDms = [];
		if (coordType == "dms") {
			latLon = this.mapService.convertDmsToDd(this.latDeg, this.latMin, this.latSec, this.selectedLat, this.lonDeg, this.lonMin, this.lonSec, this.selectedLon);
		}
		else if (coordType == "dd") {
			latLon = [this.latDec, this.lonDec];
		}

		if (!this.withinConus(latLon[0], latLon[1])) {
			return false;
		}
		else {
			return true;
		}

	}

	withinConus(lat: number, lon: number): boolean {
		if (!(this.southLat <= lat && lat <= this.northLat)) {
			return false;
		}
		else if (this.westLon <= lon && lon <= this.eastLon) {
			return true;
		}
		else {
			return false;
		}
	}

	displayError(message: string): void {
		const dialogRef = this.errorDialog.open(DialogComponent, {
	      data: {
	        dialogMessage: message
	      }
	    });
	}

	// handleComponentDisplay(): void {
		
	// 	Removes coordinate component when "compare" or "mark"
	// 	is selected for small screens.
		
	// 	if (window.innerWidth <= 500) {
	// 		this.showCoords = false;
	// 	}
	// 	else {
	// 		this.showCoords = true;
	// 	}
	// }

	// ++++++++++++++++++++++++++++++++++


}
