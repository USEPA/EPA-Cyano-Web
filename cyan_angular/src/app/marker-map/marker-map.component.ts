import { Component, OnInit } from '@angular/core';
import { Location as NgLocation } from '@angular/common';
import { latLng, tileLayer, marker, icon, Map, LayerGroup, popup, Marker, map } from 'leaflet';
import { Router } from '@angular/router';

import { LocationService } from '../services/location.service';
import { MapService } from '../services/map.service';
import { Location } from '../models/location';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';

import { ConcentrationRanges } from '../test-data/test-levels';

@Component({
  selector: 'app-marker-map',
  templateUrl: './marker-map.component.html',
  styleUrls: ['./marker-map.component.css']
})
export class MarkerMapComponent implements OnInit {

  panDelay: number = 5000;  // panning event delay (ms)
  isEnabled: boolean = true;

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
    private user: UserService,
    private authService: AuthService,
    private ngLocation: NgLocation,
  ) {}

  ngOnInit() {
    this.getLocations();
    let username = this.user.getUserName();
    let path = this.ngLocation.path();
    if (username == '' && !path.includes('reset')) {
      this.router.navigate(['/account']);
    }
  }

  mapPanEvent(e: any): void {

    if (!this.authService.checkUserAuthentication()) { return; }  // won't auto log out, just skips refresh

    if (this.isEnabled == true) {
      this.isEnabled = false;
      this.authService.refresh();
      setTimeout(() => { this.isEnabled = true; }, this.panDelay);  // blocks refresh() call for panDelay milliseconds
    }
  }

  getLocations(): void {
    this.locationService.getLocations(this.mapService.getSource()).subscribe();
  }

  onMapReady(map: Map) {
    // Initialize Map
    this.mapService.setMap(map);
  }

  addMarkerOnClick(e: any): void {
    if (!this.authService.checkUserAuthentication()) { return; }

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

}
