import { Component, OnInit } from '@angular/core';
import { latLng, tileLayer, marker, icon, Map, LayerGroup, popup, Marker, map, LatLng } from 'leaflet';
import { Subscription } from 'rxjs';

import { Location } from '../models/location';

import { LocationService } from '../services/location.service';
import { MapService } from '../services/map.service';
import { AuthService } from '../services/auth.service';

import { ConcentrationRanges } from '../test-data/test-levels';

@Component({
  selector: 'app-coordinates',
  templateUrl: './coordinates.component.html',
  styleUrls: ['./coordinates.component.css']
})
export class CoordinatesComponent implements OnInit {

	cyan_ranges: ConcentrationRanges;

	marked: string = 'Mark';

	selectedLat: string = 'N';
	selectedLon: string = 'W';

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
	selectedKey: string = "dms";

  constructor(
	private locationService: LocationService,
	private mapService: MapService,
	private authService: AuthService
  ) { }

  ngOnInit() {
  	if (!this.authService.checkUserAuthentication()) { 
  		return;
  	}
  }

	markLocation(): void {
		if (!this.authService.checkUserAuthentication()) {
			return;
		}
		if (!this.validateCoords()) {
			return;
		}
		this.location = this.getLocationData();
		this.locationService.setMarked(this.location, true);
		this.mapService.updateMarker(this.location);
		this.locationService.updateLocation(this.location.name, this.location);
	}

	compareLocation(): void {
		if (!this.authService.checkUserAuthentication()) {
			return;
		}
		if (!this.validateCoords()) {
			return;
		}
		this.location = this.getLocationData();
		this.locationService.addCompareLocation(this.location);
	}

	getLocationData() {
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

		let latLon = this.mapService.getLatLng(location);

		location = this.locationService.createLocation(name, latLon.lat, latLon.lng, cellCon, maxCellCon, cellChange, dataDate, source);

		map.setView(latLon, 12);
		let m = this.mapService.addMarker(location);
		m.fireEvent('click');

		return location;
	}

	onSelect(selectedValue) {
		console.log(selectedValue);
		this.selectedKey = selectedValue.value;
	}

	validateCoords() {
		/*
		Checks whether coordinates are within CONUS.
		*/
		// Convert to dd if in dms.
		let latLon = [];
		if (this.selectedKey == "dd") {
			let latLonDms = this.mapService.convertDdToDms(this.latDec, this.lonDec);
			this.setDmsCoords(latLonDms);
			latLon = [this.latDec, this.lonDec];
		}
		else if (this.selectedKey == "dms") {
			latLon = this.mapService.convertDmsToDd(this.latDeg, this.latMin, this.latSec, this.lonDeg, this.lonMin, this.lonSec);
		}

		if (!this.mapService.withinConus(latLon[0], latLon[1])) {
			alert("Requested coordinates not within CONUS.");
			return false;
		}
		return true;
	}

	setDmsCoords(latLonDms: Array<number>) {
		this.latDeg = latLonDms[0];
		this.latMin = latLonDms[1];
		this.latSec = latLonDms[2];
		this.lonDeg = latLonDms[3];
		this.lonMin = latLonDms[4];
		this.lonSec = latLonDms[5];
	}

}
