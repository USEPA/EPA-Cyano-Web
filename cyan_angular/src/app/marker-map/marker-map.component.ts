import { Component, OnInit } from '@angular/core';
import { latLng, tileLayer, marker, icon, Map, LayerGroup, popup, Marker, map } from 'leaflet';
import { Router } from '@angular/router';

import { LocationService } from '../services/location.service';
import { MapService } from '../services/map.service';
import { ConfigService } from '../services/config.service';
import { Location } from '../models/location';
import { UserService } from '../services/user.service';

import { ConcentrationRanges } from '../test-data/test-levels';

@Component({
  selector: 'app-marker-map',
  templateUrl: './marker-map.component.html',
  styleUrls: ['./marker-map.component.css']
})
export class MarkerMapComponent implements OnInit {
  cyan_ranges: ConcentrationRanges;

  lat_0: number = 33.927945;
  lng_0: number = -83.346554;

  marker_layers: LayerGroup;

  esriImagery = tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    detectRetina: true,
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  });
  streetMaps = tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    detectRetina: true,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });
  topoMap = tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
    detectRetina: true,
    attribution: 'Tiles &copy; Esri'
  });

  layersControl = {
    baseLayers: {
      'Imagery Maps': this.esriImagery,
      'Street Maps': this.streetMaps,
      'Topographic Maps': this.topoMap
    }
  };

  options = {
    layers: [this.esriImagery],
    zoom: 4,
    center: latLng([this.lat_0, this.lng_0])
  };

  constructor(
    private locationService: LocationService,
    private router: Router,
    private mapService: MapService,
    private configService: ConfigService,
    private user: UserService
  ) {}

  ngOnInit() {
    this.getLocations();
    this.getCyanRanges();
    let username = this.user.getUserName();
    if (username == '') {
      this.router.navigate(['/account']);
    }
  }

  getCyanRanges(): void {
    this.configService.getLevels().subscribe(levels => (this.cyan_ranges = levels));
  }

  getLocations(): void {
    this.locationService.getLocations(this.mapService.getSource()).subscribe();
  }

  onMapReady(map: Map) {
    // Initialize Map
    this.mapService.setMap(map);
  }

  addMarkerOnClick(e: any): void {
    let map = this.mapService.getMap();
    let lat = e.latlng.lat;
    let lng = e.latlng.lng;

    let name = 'To Be Updated...';
    let cellCon = 0;
    let maxCellCon = 0;
    let cellChange = 0;
    let dataDate = '01/01/2018';
    let source = 'OLCI';

    let location = this.locationService.createLocation(name, lat, lng, cellCon, maxCellCon, cellChange, dataDate, source);
    map.setView(e.latlng, 12);
    let m = this.mapService.addMarker(location);
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
