import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { ajax } from 'rxjs/ajax';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { tileLayer, geoJSON, latLng, LatLng, Map, icon, marker, canvas, circleMarker, DomEvent } from 'leaflet';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field'
import { DatePipe } from '@angular/common';

import { WaterBody, WaterBodyStats, WaterBodyData } from '../models/waterbody';
import { WaterBodyStatsDialog } from './waterbody-stats-details.component';
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

  constructor(
  	private downloader: DownloaderService,
  	private authService: AuthService,
  	private router: Router,
  	private mapService: MapService,
  	private cyanMap: CyanMap,
  	private wbDialog: MatDialog,
    private dialog: DialogComponent,
  	private loaderService: LoaderService,
    private coords: CoordinatesComponent
  ) { }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
  	this.removeWaterbodyCentroids();
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

  getWaterbodyGeojson(wb: WaterBody): void {
    /*
    Makes request to cyan-waterbody to get
    geojson of selected waterbody.
    */
    this.removeGeojsonLayer();

    this.downloader.getWaterbodyGeometry(wb.objectid).subscribe(response => {

      let geojson = response['geojson'][0][0];  // TODO: Account for > 1 features
      
      this.wbLayer = geoJSON(geojson, {
        bubblingMouseEvents: false  // prevents wb shape click event from trigger location creation
      });
      
      this.cyanMap.map.addLayer(this.wbLayer);
      
      this.wbLayer.on('click', event => {
        this.openWaterbodyStatsDialog(wb);
      });

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

  addWaterbodyCentroids(): void {
    /*
    Adds map layer of dots indicating the available
    waterbody centroids.
    */
    this.downloader.getAllWaterbodies().subscribe(response => {

      let waterbodies = this.checkWaterbodyResponse(response);

      waterbodies.forEach(wb => {
        let m = circleMarker(latLng(wb['centroid_lat'], wb['centroid_lng']), {
          renderer: this.canvasRenderer,
          radius: 3,
          fill: true,
          fillOpacity: 1.0
        }).addTo(this.cyanMap.map).bindPopup(this.createPopupData(wb));
        this.wbMarkers.push(m);
      });

    });
  }

  removeWaterbodyCentroids(): void {
    /*
    Removes waterbody markers from map.
    */
    this.wbMarkers.forEach(marker => {
      this.cyanMap.map.removeLayer(marker);
    });
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

  openWaterbodyStatsDialog(selectedWaterbody: WaterBody) {
    /*
    Opens dialog showing selected location's
    waterbody stats.
    */
    if (!this.authService.checkUserAuthentication()) { return; }
    const dialogRef = this.wbDialog.open(WaterBodyStatsDialog, {
      // panelClass: 'view-comment-dialog',
      // TODO: Use class to account for various device sizes
      // width: '75%',
      // height: '75%',
      maxWidth: '95%',
      maxHeight: '95%',
      data: {
        selectedWaterbody: selectedWaterbody
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.ngOnDestroy();
    });

  }

  panToWaterbody(selectedWaterbody: WaterBody) {
    /*
    Pans to the selected waterbody and displays popup.
    */
    this.cyanMap.map.flyTo(
      latLng(
        selectedWaterbody['centroid_lat'],
        selectedWaterbody['centroid_lng']
      ), 12
    );
  }

  handleWaterbodySelect(selectedWaterbody: WaterBody): void {
    this.panToWaterbody(selectedWaterbody);
    this.getWaterbodyGeojson(selectedWaterbody);
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

}
