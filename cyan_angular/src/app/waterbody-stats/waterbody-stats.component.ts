import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { ajax } from 'rxjs/ajax';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { tileLayer, geoJSON, latLng, LatLng, latLngBounds, LatLngBounds, Map, icon, marker, canvas, circleMarker, DomEvent } from 'leaflet';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field'
import { DatePipe } from '@angular/common';

import { WaterBody, WaterBodyStats, WaterBodyData, WaterBodyProperties } from '../models/waterbody';
import { WaterBodyStatsDetails } from './waterbody-stats-details.component';
import { Calculations } from './calculations';
import { DownloaderService } from '../services/downloader.service';
import { AuthService } from '../services/auth.service';
import { MapService } from '../services/map.service';
import { CyanMap } from '../utils/cyan-map';
import { DialogComponent } from '../shared/dialog/dialog.component';
import { LoaderService } from '../services/loader.service';
import { CoordinatesComponent } from '../coordinates/coordinates.component';


@Component({
  selector: 'app-waterbody-stats',
  templateUrl: './waterbody-stats.component.html',
  styleUrls: ['./waterbody-stats.component.css']
})
export class WaterbodyStatsComponent implements OnInit {

	waterbodies: WaterBody[];
	waterbodyResults: WaterBody[];

	waterbodyName: string = '';
	waterbodyLat: number = null;
	waterbodyLon: number = null;

  searchResultLimit: number = 100;  // max allowed search results
  searchCharMin: number = 3;  // min allowed characters for WB searching
  searchCharMax: number = 256;  // max allowed characters for WB searching


  wbLayer = null;

  searchSelect: any = {
  	'name': 'Name',
  	'coords': 'Coordinates'
  }
  defaultSelected: string = 'name';
	selectedKey: string = 'name';  // name or coords

  canvasRenderer = canvas();

  wbMarkers = [];

  wbProps: WaterBodyProperties = new WaterBodyProperties();

  constructor(
  	private downloader: DownloaderService,
  	private authService: AuthService,
  	private router: Router,
  	private mapService: MapService,
  	private cyanMap: CyanMap,
  	private wbDialog: MatDialog,
    private dialog: DialogComponent,
  	private loaderService: LoaderService,
    private coords: CoordinatesComponent,
    private wbStats: WaterBodyStatsDetails,
    private calcs: Calculations
  ) { }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    this.removeGeojsonLayer();
  }

  exit(): void {
  	/*
  	Routes to main view.
  	*/
  	this.router.navigate(['']);
  }

  onSelect(selectedValue: any): void {
  	/*
  	Handles selection change for search type.
  	*/
  	this.selectedKey = selectedValue.value;
  }

  getAllWaterbodies(): void {
  	/*
  	Returns full list of waterbodies with their names
  	and associated objectid.
  	*/
  	this.loaderService.show();
  	this.downloader.getAllWaterbodies().subscribe(response => {
  		this.loaderService.hide();
  	});
  }

  removeGeojsonLayer(): void {
    /*
    Removes geoJSON layer from map.
    */
    if (this.wbLayer) {
      this.cyanMap.map.removeLayer(this.wbLayer);
    }
  }

  createPopupData(wb): string {
    /*
    Creates data for marker/point on map.
    */
    let popupContent = '<b>Object ID:</b> ' + wb['objectid']
      + '<br><b>Name:</b> ' + wb['name']
      + '<br><b>Centroid Latitude:</b> ' + wb['centroid_lat']
      + '<br><b>Centroid Longitude:</b> ' + wb['centroid_lng'];
    return popupContent;
  }

  searchForWaterbodyByName() {
  	/*
  	Searches for waterbody by name.
  	*/
    this.validateNameSearchInputs();
  	this.loaderService.show();
  	this.downloader.searchForWaterbodyByName(this.waterbodyName).subscribe(result => {
  		this.loaderService.hide();
  		let wbResults = this.checkWaterbodyResponse(result);
  		this.waterbodyResults = this.createWaterbodyResults(wbResults);
  	});
  }

  searchForWaterbodyByCoords() {
  	/*
  	Searches for waterbody by lat/lon coords.
  	*/
    this.validateCoordSearchInputs();
  	this.loaderService.show();
  	this.downloader.searchForWaterbodyByCoords(this.waterbodyLat, this.waterbodyLon).subscribe(wbInfoResult => {
      this.loaderService.hide();
      let wbResults = this.checkWaterbodyResponse(wbInfoResult);
      this.waterbodyResults = this.createWaterbodyResults(wbResults);
  	});
  }

  checkWaterbodyResponse(waterbodyResponse: any) {
  	/*
  	Checks response from waterbody name search.
  	*/
  	if (!waterbodyResponse.hasOwnProperty('waterbodies')) {
  		this.dialog.handleError('No waterbodies data');
  	}
  	else if (waterbodyResponse['waterbodies'] == 'NA') {
  		this.dialog.handleError('No waterbodies found');
  	}
    else if (waterbodyResponse['waterbodies'].length > this.searchResultLimit) {
      this.dialog.handleError('Too many results from search');
    }
  	return waterbodyResponse['waterbodies'];
  }

  createWaterbodyResults(waterbodyResponse: any): WaterBody[] {
  	/*
  	Creates Waterbody objects from waterbody name search results.
  	*/
  	let waterbodyResults = [];
  	waterbodyResponse.forEach(waterbodyData => {
  		let waterbody = new WaterBody();
  		waterbody.objectid = waterbodyData['objectid'];
  		waterbody.name = waterbodyData['name'];
  		waterbody.centroid_lat = waterbodyData['centroid_lat'];
  		waterbody.centroid_lng = waterbodyData['centroid_lng'];
      waterbody.areasqkm = waterbodyData['areasqkm'];
      waterbody.state_abbr = waterbodyData['state_abbr'];
  		waterbodyResults.push(waterbody);
  	});
		return waterbodyResults;
  }

  openWaterbodyStatsDialog(selectedWaterbody: WaterBody, wbProps: WaterBodyProperties) {
    /*
    Opens dialog showing selected location's
    waterbody stats.
    */
    if (!this.authService.checkUserAuthentication()) { return; }
    this.router.navigate(['/wbstats', {
        selectedWaterbody: JSON.stringify(selectedWaterbody),
        wbProps: JSON.stringify(wbProps)
      }
    ]);
  }

  handleWaterbodySelect(selectedWaterbody: WaterBody): void {
    this.loaderService.show();
    this.downloader.getWaterbodyProperties(selectedWaterbody.objectid).subscribe(result => {
      this.loaderService.hide();
      this.createWaterbodyProperties(result);
      let topLeft = latLng(this.wbProps['y_max'], this.wbProps['x_min']);
      let bottomRight = latLng(this.wbProps['y_min'], this.wbProps['x_max']);
      let wbBounds = latLngBounds(topLeft, bottomRight);
      this.cyanMap.map.flyToBounds(wbBounds);
      this.openWaterbodyStatsDialog(selectedWaterbody, this.wbProps);
    });
  }

  validateCoordSearchInputs() {
    /*
    Validates user input for searching WBs by coordinates.
    */
    if (!this.waterbodyLat || !this.waterbodyLon) {
      this.dialog.handleError('Provide a latitude and longitude to search for a waterbody');
    }
    else if(!this.coords.withinConus(this.waterbodyLat, this.waterbodyLon)) {
      this.dialog.handleError('Coordinates are not within CONUS');
    }
  }

  validateNameSearchInputs() {
    /*
    Validates user input for searching WBs by name.
    */
    if (this.waterbodyName.length <= 0) {
      this.dialog.handleError('Provide a waterbody name to search');
    }
    else if (this.waterbodyName.length < this.searchCharMin) {
      this.dialog.handleError('Waterbody name is too small');
    }
    else if (this.waterbodyName.length > this.searchCharMax) {
      this.dialog.handleError('Waterbody name is too large');
    }
  }

  createWaterbodyProperties(propResults) {
    /*
    Creates WaterBodyProperties objects from properties results.
    */
    if (!('properties' in propResults)) {
      this.dialog.handleError("No properties found for waterbody");
    }
    this.wbProps.areasqkm = this.calcs.roundValue(propResults['properties']['AREASQKM']);
    this.wbProps.elevation = this.calcs.roundValue(propResults['properties']['ELEVATION']);
    this.wbProps.fcode = propResults['properties']['FCODE'];
    this.wbProps.fdate = propResults['properties']['FDATE'];
    this.wbProps.ftype = propResults['properties']['FTYPE'];
    this.wbProps.globalid = propResults['properties']['GLOBALID'];
    this.wbProps.gnis_id = propResults['properties']['GNIS_ID'];
    this.wbProps.gnis_name = propResults['properties']['GNIS_NAME'];
    this.wbProps.objectid = propResults['properties']['OBJECTID'];
    this.wbProps.permanent_ = propResults['properties']['PERMANENT_'];
    this.wbProps.reachcode = propResults['properties']['REACHCODE'];
    this.wbProps.resolution = propResults['properties']['RESOLUTION'];
    this.wbProps.shape_area = this.calcs.roundValue(propResults['properties']['SHAPE_AREA']);
    this.wbProps.shape_leng = this.calcs.roundValue(propResults['properties']['SHAPE_LENG']);
    this.wbProps.state_abbr = propResults['properties']['STATE_ABBR'];
    this.wbProps.visibility = propResults['properties']['VISIBILITY'];
    this.wbProps.c_lat = propResults['properties']['c_lat'];
    this.wbProps.c_lng = propResults['properties']['c_lng'];
    this.wbProps.x_max = propResults['properties']['x_max'];
    this.wbProps.x_min = propResults['properties']['x_min'];
    this.wbProps.y_max = propResults['properties']['y_max'];
    this.wbProps.y_min = propResults['properties']['y_min'];
  }

}
