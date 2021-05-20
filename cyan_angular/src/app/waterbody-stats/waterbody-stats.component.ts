import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { ajax } from 'rxjs/ajax';
import { tileLayer, geoJSON, latLng, LatLng, Map, icon, marker, canvas, circleMarker } from 'leaflet';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { WaterBody } from '../models/waterbody';
import { DownloaderService } from '../services/downloader.service';
import { AuthService } from '../services/auth.service';
import { MapService } from '../services/map.service';
import { CyanMap } from '../utils/cyan-map';
import { DialogComponent } from '../shared/dialog/dialog.component';
import { LoaderService } from '../services/loader.service';


@Component({
  selector: 'app-waterbody-stats',
  templateUrl: './waterbody-stats.component.html',
  styleUrls: ['./waterbody-stats.component.css']
})
export class WaterbodyStatsComponent implements OnInit {

	waterbodies: WaterBody[];
	waterbodyResults: WaterBody[];

	waterbodyName: string = '';
	waterbodyLat: number;
	waterbodyLon: number;

	lat_0: number = 33.927945;
  lng_0: number = -83.346554;

  wbLayer = geoJSON();
  wbUrl = 'assets/waterbodies_4.json';

  searchSelect: any = {
  	'name': 'Name',
  	'coords': 'Coordinates'
  }
  defaultSelected: string = 'name';
	selectedKey: string = 'name';  // name or coords

  // canvasRenderer = canvas({padding: 0.5});
  canvasRenderer = canvas();

  wbMarkers = [];

  constructor(
  	private downloader: DownloaderService,
  	private authService: AuthService,
  	private router: Router,
  	private mapService: MapService,
  	private cyanMap: CyanMap,
  	private messageDialog: MatDialog,
  	private loaderService: LoaderService
  ) { }

  ngOnInit(): void {
  	// this.getAllWaterbodies();
  	// this.getWaterbodyShapes();
    this.addWaterbodyCentroids();
  }

  ngOnDestroy(): void {
  	this.removeWaterbodyCentroids();
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

  handleError(error: string): void {
    /*
    Handles error message to user and any housekeeping,
    and halts the execution by throwing error.
    */
    this.displayMessageDialog(error);
    // this.uploadedFile = null;
    // this.clearInputFields();
    throw error;
  }

  displayMessageDialog(message: string): void {
    /*
    Displays dialog messages to user.
    */
    this.messageDialog.open(DialogComponent, {
      data: {
        dialogMessage: message
      }
    });
  }

  getAllWaterbodies(): void {
  	/*
  	Returns full list of waterbodies with their names
  	and associated objectid.
  	*/
  	this.loaderService.show();
  	this.downloader.getAllWaterbodies().subscribe(response => {
  		this.loaderService.hide();
  		console.log("getAllWaterbodies response: ")
  		console.log(response)
  		// TODO: Set waterbodies parameter with response data.
  	});
  }

  getWaterbodyShapes(): void {
  	/*
  	Loads waterbody geoJSON onto map.
  	*/
  	this.loaderService.show();
  	ajax(this.wbUrl).subscribe(data => {
  		this.loaderService.hide();
    	console.log("incoming data: ")
    	console.log(data);
    	this.wbLayer.addData(data.response);
    	this.cyanMap.map.addLayer(this.wbLayer);
    });
  }

  addWaterbodyCentroids(): void {
    /*
    Adds map layer of dots indicating the available
    waterbody centroids.
    */
    this.downloader.getAllWaterbodies().subscribe(response => {
      console.log("all WBs response: ")
      console.log(response)

      let waterbodies = this.checkWaterbodyResponse(response);

      waterbodies.forEach(wb => {
        let m = circleMarker(latLng(wb['centroid_lat'], wb['centroid_lng']), {
          renderer: this.canvasRenderer,
          radius: 5,
          fill: true,
          fillOpacity: 0.9
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
    console.log("Search waterbody using coordinates")
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
  		this.handleError('No waterbodies data');
  	}
  	else if (waterbodyResponse['waterbodies'] == 'NA') {
  		this.handleError('No waterbodies found');
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
    const dialogRef = this.messageDialog.open(WaterBodyStatsDialog, {
      // panelClass: 'view-comment-dialog',
      // TODO: Use class to account for various device sizes
      // width: '60%',
      // maxWidth: '75%',
      // height: '75%'
      width: '50%',
      height: '50%',
      data: {
        selectedWaterbody: selectedWaterbody
      }
    });

  }

  panToWaterbody(selectedWaterbody: WaterBody) {
    /*
    Pans to the selected waterbody and displays popup.
    */
    console.log("panToWaterbody() called.")
    console.log(this.cyanMap.map['layers']);
    this.cyanMap.map.flyTo(
      latLng(
        selectedWaterbody['centroid_lat'],
        selectedWaterbody['centroid_lng']
      ), 12
    );
  }

  hightlightWaterbodies(waterbodies: WaterBody[]) {
    /*
    Hightlights waterbody markers that show up in search results.
    */

  }

}



@Component({
  selector: 'app-waterbody-stats-details',
  templateUrl: './waterbody-stats-details.component.html',
  styleUrls: ['./waterbody-stats.component.css']
})
export class WaterBodyStatsDialog {
  /*
  Dialog for viewing waterbody stats.
  */

  // dialogMessage: string = "";
  selectedWaterbody: WaterBody;
  waterbodyData: any = {};

  constructor(
    public dialogRef: MatDialogRef<DialogComponent>,
    private authService: AuthService,
    private downloader: DownloaderService,
    private loaderService: LoaderService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
    // this.dialogMessage = this.data.dialogMessage;
    this.selectedWaterbody = this.data.selectedWaterbody;
    this.getWaterbodyData();
  }

  exit(): void {
    this.dialogRef.close();
  }

  getWaterbodyData() {
    /*
    Makes request to get selected waterbody data.
    */
    console.log("Getting waterbody data")
    // this.loaderService.show();
    this.downloader.getWaterbodyData(this.selectedWaterbody.objectid).subscribe(result => {
      // this.loaderService.hide();
      console.log("getWaterbodyData results: ")
      console.log(result)
      this.waterbodyData['daily'] = result['daily']
      this.waterbodyData['data'] = JSON.stringify(result['data'])
    });
  }

}