import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Location as NgLocation } from '@angular/common';
import { latLng, tileLayer, marker, icon, Map, LayerGroup, popup, Marker, map, DomUtil, Control, latLngBounds, ImageOverlay } from 'leaflet';
import * as L from 'leaflet';
import { featureLayer } from 'esri-leaflet';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { LocationService } from '../services/location.service';
import { MapService } from '../services/map.service';
import { Location } from '../models/location';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { EnvService } from '../services/env.service';
import { DownloaderService } from '../services/downloader.service';
import { WaterbodyStatsComponent } from '../waterbody-stats/waterbody-stats.component';
import { Calculations } from '../waterbody-stats/utils/calculations';
import { DialogComponent } from '../shared/dialog/dialog.component';

import { ConcentrationRanges } from '../test-data/test-levels';

@Component({
  selector: 'app-marker-map',
  templateUrl: './marker-map.component.html',
  styleUrls: ['./marker-map.component.css']
})
export class MarkerMapComponent implements OnInit {

  panDelay: number = 5000;  // panning event delay (ms)
  isEnabled: boolean = true;
  isClicking: boolean = false;  // tracks user click for distinguishing pan vs click

  lat_0: number = 33.927945;
  lng_0: number = -83.346554;

  // bottom: number = 24.623340905712205;
  // right: number = -65.03986894612699;
  // left: number = -131.1651209108407;
  // top: number = 52.9220879731627;

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

  // topLeft = latLng(this.top, this.left);
  // bottomRight = latLng(this.bottom, this.right);
  // imageBounds = latLngBounds(this.bottomRight, this.topLeft);

  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++
  // TODO: Get latest daily and weekly layers from WB API.
  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++
  // waterbodyDataLayer = null;  // defined in map service

  waterbodiesLayer = featureLayer({
    url: 'https://services.arcgis.com/cJ9YHowT8TU7DUyn/ArcGIS/rest/services/waterbodies_9/FeatureServer/0',
    bubblingMouseEvents: false
  });

  layersControl = {
    baseLayers: {
      'Imagery Maps': this.esriImagery,
      'Street Maps': this.streetMaps,
      'Topographic Maps': this.topoMap,
    },
    overlays: {
      // 'Latest Daily Data': this.waterbodyDataLayer,
      'Waterbodies Layer': this.waterbodiesLayer
    }
  };

  options = {
    layers: [this.esriImagery],
    zoom: 4,
    center: latLng([this.lat_0, this.lng_0])
  };

  currentAttempts: number = 0;
  totalPrevDayAttempts: number = 50;

  configSetSub: Subscription;

  customControl: any;

  constructor(
    private locationService: LocationService,
    private router: Router,
    private mapService: MapService,
    private user: UserService,
    private authService: AuthService,
    private ngLocation: NgLocation,
    private envService: EnvService,
    private downloader: DownloaderService,
    private waterbodyStats: WaterbodyStatsComponent,
    private calcs: Calculations,
    private dialog: DialogComponent
  ) { }

  ngOnInit() {
    this.getLocations();
    let username = this.user.getUserName();
    let path = this.ngLocation.path();
    if (username == '' && !path.includes('reset')) {
      this.router.navigate(['/account']);
    }

    this.tileLayerEvents();  // updates main map's tile layer for minimap to access

    this.configSetSub = this.envService.configSetObservable.subscribe(configSet => {
      if (configSet === true) {
        console.log("config set, getting conus image");
        this.getMostCurrentAvailableDate();
      }
    });

  }

  ngAfterViewInit() {
    this.mapService.getMap().on('mousedown', event => {
      // console.log("mousedown event")
      this.isClicking = true;  // initally assumes user intends to click
    });
    this.mapService.getMap().on('mouseup', event => {
      // console.log("mouseup event")
    });

  }

  tileLayerEvents() {
    this.esriImagery.on('load', event => {
      // console.log("esriImagery loaded")
      this.mapService.mainTileLayer = "Imagery Maps";  
    });
    this.streetMaps.on('load', event => {
      // console.log("streetMaps loaded")
      this.mapService.mainTileLayer = "Street Maps";
    });
    this.topoMap.on('load', event => {
      // console.log("topoMap loaded")
      this.mapService.mainTileLayer = "Topographic Maps";
    });
    // this.mapService.waterbodyDataLayer.on('load', event => {
    //   console.log("waterbodyDataLayer loaded: ", event)getConusImage
    //   this.mapService.waterbodyDataLayer.addTo(this.mapService.getMap());
    // });
    this.waterbodiesLayer.on('click', event => {
      this.displayWaterbodyDetails(event);
    });
  }

  displayWaterbodyDetails(event): void {
    // Goes to WB stats for selected WB:
    this.downloader.searchForWaterbodyByCoords(event.latlng.lat, event.latlng.lng).subscribe(result => {
      if (!('waterbodies' in result)) {
        console.log("No waterbodies found: ", result)
        return;
      }
      if (result['waterbodies'].length < 1) {
        console.log("No waterbodies array: ", result)
        return;
      }
      let waterbody = {
        objectid: result['waterbodies'][0]['objectid'],
        name: result['waterbodies'][0]['name'],
        centroid_lat: result['waterbodies'][0]['centroid_lat'],
        centroid_lng: result['waterbodies'][0]['centroid_lng'],
        areasqkm: result['waterbodies'][0]['areasqkm'],
        state_abbr: result['waterbodies'][0]['state_abbr']
      };
      this.waterbodyStats.handleWaterbodySelect(waterbody)
    });
  }

  getMostCurrentAvailableDate(daily: boolean = true) {
    /*
    Makes requests for most current available date. Goes back
    previous days until it finds an available date.
    */

    console.log("getMostCurrentAvailableDate daily: ", daily)

    let dailyParam = daily === true ? 'True' : 'False';

    console.log("getMostCurrentAvailableDate dailyParam: ", dailyParam)

    let prevDate = this.calcs.getDayOfYearFromDateObject(
      new Date(new Date().setDate(new Date().getDate() - this.currentAttempts))
    );
    let startYear = parseInt(prevDate.split(' ')[0]);
    let startDay = parseInt(prevDate.split(' ')[1]);

    // this.isLoading = true;

    this.downloader.getConusImage(startYear, startDay, dailyParam).subscribe(result => {

      console.log("getConusImage result: ", result);

      // No data response:
      // {
      //   "daily": true,
      //   "day": 234,
      //   "message": "No conus cyano image found for the inputs provided.",
      //   "year": 2021
      // }

      let resonseType = result.body.type;
      let responseStatus = result.status;


      if (resonseType != 'image/png' || responseStatus != 200) {
        // No data, retry with the date before this one:
        if (this.currentAttempts >= this.totalPrevDayAttempts) {
          this.currentAttempts = 0;
          this.dialog.handleError('No conus waterbody image found');
        }
        this.currentAttempts += 1;
        this.getMostCurrentAvailableDate();
      }
      else {
        this.currentAttempts = 0;
        let imageBlob = result.body;
        let dateString = this.calcs.getDateFromDayOfYear(startYear + ' ' + startDay);
        let dataTypeString = daily === true ? 'Daily' : 'Weekly';
        this.addImageLayer(imageBlob, dateString, dataTypeString);
        this.addCustomLabelToMap(dateString, dataTypeString);
      }

    });

  }

  addImageLayer(image: Blob, dateString: string, dataTypeString: string): any {
    let reader = new FileReader();
    reader.addEventListener("load", () => {
      let imageUrl = reader.result.toString();
      let imageLayerTitle = 'Latest ' + dataTypeString + ' Data (' + dateString + ')';
      this.mapService.waterbodyDataLayer = new ImageOverlay(imageUrl, this.mapService.imageBounds);
      this.mapService.waterbodyDataLayer.addTo(this.mapService.getMap());
      this.layersControl.overlays[imageLayerTitle] = this.mapService.waterbodyDataLayer;  // adds lealet control
      return reader.result;
    }, false);
    if (image) {
      reader.readAsDataURL(image);
    }
  }

  addCustomLabelToMap(dateString: string, dataTypeString: string): void {
    if (this.customControl) {
      this.mapService.getMap().removeControl(this.customControl);
    }
    this.customControl = L.Control.extend({
      options: {
        position: 'topright'
      },
      onAdd: function(map) {
        let container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        container.style.background = 'white';
        container.style.padding = '5px';
        container.textContent = dataTypeString + ' Data for ' + dateString;
        return container;
      }
    });
    this.mapService.getMap().addControl(new this.customControl);
  }

  mapPanEvent(e: any): void {

    if (!this.authService.checkUserAuthentication()) { return; }  // won't auto log out, just skips refresh

    this.isClicking = false;  // assumes user intends to pan instead of placing location

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

    if (!this.isClicking) {
      // Discards click if panning occurred during click down/up
      console.log("Panning occurred during mousedown event. Skipping click event.")
      return;
    }

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

  addMiniMarkerOnClick(e: any): void {
    /*
    Adds marker to the location-details miniMap
    (and the main map as well).
    */

    if (!this.authService.checkUserAuthentication()) { return; }

    // NOTE: Ignores click event based on deployed environment.
    if(this.envService.config.disableMarkers === true) {
      return;
    }

    let lat = e.latlng.lat;
    let lng = e.latlng.lng;

    let name = 'To Be Updated...';
    let cellCon = 0;
    let maxCellCon = 0;
    let cellChange = 0;
    let dataDate = '01/01/2018';
    let source = 'OLCI';

    let location = this.locationService.createLocation(name, lat, lng, cellCon, maxCellCon, cellChange, dataDate, source);

    let miniMap = this.mapService.getMinimap();
    miniMap.setView(e.latlng, 12);

    let m = this.mapService.addMarker(location);  // adds marker to main map
    m.fireEvent('click');
    this.mapService.getMap().closePopup();  // closes popup on main map

    let miniMarker = this.mapService.addMiniMarker(location);  // adds blank marker to minimap

    this.setMiniMarkerEvents(miniMarker, location);

  }


  setMiniMarkerEvents(miniMarker: Marker, location: Location): void {
    /*
    Adds marker events to marker on the mini map.
    */
    let self = this;
    miniMarker.on('click', function(e) {
      self.mapService.deleteMiniMarker(location);  // remove from miniMap
      self.mapService.deleteMarker(location);  // remove from main map
      self.locationService.deleteLocation(location);  // remove location from user db
    });
    miniMarker.on('mouseover', function(e) {
      miniMarker.setIcon(self.mapService.createIcon(null, 'remove'));
    });
    miniMarker.on('mouseout', function(e) {
      miniMarker.setIcon(self.mapService.createIcon(null));
    });
  }

}
