import { Component, OnInit } from '@angular/core';
import { latLng, tileLayer, marker, icon, Map, LayerGroup, popup, Marker, map, LatLng } from 'leaflet';
import { Subscription } from 'rxjs';

import { Location } from '../models/location';

import { LocationService } from '../services/location.service';
import { MapService } from '../services/map.service';
import { DownloaderService } from '../services/downloader.service';
import { UserService } from '../services/user.service';
import { ConfigService } from '../services/config.service';

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

  constructor(
		private locationService: LocationService,
		private mapService: MapService,
		private downloaderService: DownloaderService,
		private user: UserService,
		private configService: ConfigService
  ) { }

  ngOnInit() {
		this.getCyanRanges();
  }

	getCyanRanges(): void {
		this.configService.getLevels().subscribe(levels => (this.cyan_ranges = levels));
	}

	toggleMarkedLocation(ln: Location): void {
		let m = this.marked == 'Mark' ? false : true;
		this.locationService.setMarked(ln, m);
		// Change mark button label
		let label = document.getElementById('marked-label');
		label.innerHTML = this.marked;
		// Change mark button icon
		let icon = document.getElementById('marked-icon');
		let iconClasses = icon.classList;
		if (iconClasses.contains('mark')) {
			icon.className = 'unmark';
		} else {
			icon.className = 'mark';
		}
		this.marked = m ? 'Unmark' : 'Mark';
		this.mapService.updateMarker(ln);
		this.locationService.updateLocation(ln.name, ln);
	}

	compareLocation(): void {
		console.log("coordinates compareLocation()");
		this.getLocationData();
		this.locationService.addCompareLocation(e);
	}

	getLocationData() {
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


		console.log("coordinates getLocationData()");

		let latLon = this.mapService.getLatLng(location);

		location = this.locationService.createLocation(name, latLon.lat, latLon.lng, cellCon, maxCellCon, cellChange, dataDate, source);
		map.setView(latLon, 12);
		let m = marker(this.mapService.getLatLng(location), {
			icon: icon({
				iconSize: [30, 36],
				iconAnchor: [13, 41],
				iconUrl: this.getMarker(location.cellConcentration, location.marked),
				shadowUrl: 'leaflet/marker-shadow.png'
			}),
			title: location.name,
			riseOnHover: true,
			zIndexOffset: 10000
		});
		let self = this;
		m.on('click', function(e) {
			let p = self.mapService.createPopup(self.locationService.getLocationByID(location.id));
			let o = {
				keepInView: true
			};
			map.setView(m.getLatLng(), 12);
			m.bindPopup(p, o).openPopup();
			m.unbindPopup();
		});
		this.mapService.addMarker(location.id, m);
		m.fireEvent('click');
	}

	getMarker(n: number, c: boolean): string {
		if (n <= this.cyan_ranges.low[1]) {
			if (c) {
				return 'assets/images/map_pin_green_checked.png';
			} else {
				return 'assets/images/map_pin_green_unchecked.png';
			}
		} else if (n <= this.cyan_ranges.medium[1] && n >= this.cyan_ranges.medium[0]) {
			if (c) {
				return 'assets/images/map_pin_yellow_checked.png';
			} else {
				return 'assets/images/map_pin_yellow_unchecked.png';
			}
		} else if (n <= this.cyan_ranges.high[1] && n >= this.cyan_ranges.high[0]) {
			if (c) {
				return 'assets/images/map_pin_orange_checked.png';
			} else {
				return 'assets/images/map_pin_orange_unchecked.png';
			}
		} else if (n >= this.cyan_ranges.veryhigh[0]) {
			if (c) {
				return 'assets/images/map_pin_red_checked.png';
			} else {
				return 'assets/images/map_pin_red_unchecked.png';
			}
		} else {
			if (c) {
				return 'assets/images/map_pin_green_checked.png';
			} else {
				return 'assets/images/map_pin_green_unchecked.png';
			}
		}
	}

}
