import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { LatLng } from 'leaflet';

import { LocationResult } from './location-result';
import { Location } from '../models/location';

import { DownloaderService } from '../services/downloader.service';
import { MapService } from '../services/map.service';

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
	withinUSKeyword: string = "United States";  // string to determine if result is within conus US

	constructor(
		private downloader: DownloaderService,
		private mapService: MapService
	) { }

	ngOnInit(): void {
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
		map.flyToBounds(latLonArray);
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

}
