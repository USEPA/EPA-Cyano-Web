import {Component, OnInit, Input, Inject, ViewChild} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { DatePipe } from '@angular/common';

import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';

import { latLng, latLngBounds, tileLayer, marker, icon, Map, Marker, ImageOverlay } from 'leaflet';
import { Subscription } from 'rxjs';

import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { MapService } from '../services/map.service';
import { Location } from '../models/location';
import { LocationService } from '../services/location.service';
import { LocationImagesService } from '../services/location-images.service';
import { ImageDetails } from '../models/image-details';
import { DownloaderService, RawData } from '../services/downloader.service';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { ConfigService } from '../services/config.service';
import { EnvService } from '../services/env.service';
import { DialogComponent } from '../shared/dialog/dialog.component';
import { MatDialog } from '@angular/material/dialog';


@Component({
  selector: 'app-location-details',
  templateUrl: './location-details.component.html',
  styleUrls: ['./location-details.component.css']
})
export class LocationDetailsComponent implements OnInit {

  @ViewChild('tabGroup') tabGroup;

  imageCollection: ImageDetails[];
  locationThumbs: ImageDetails[];
  locationTIFFs: ImageDetails[];
  locationPNGs: ImageDetails[];

  filteredPNGs: ImageDetails[];

  lat_0: number = 33.927945;
  lng_0: number = -83.346554;

  public current_location: Location;
  current_location_index: number;
  locations: Location[];
  imageSub: Subscription;
  loading: boolean = false;

  layer: ImageOverlay;
  selectedLayer: ImageDetails;
  selectedLayerIndex: number;
  slidershow: boolean = false;
  showSliderValue: boolean = true;

  minDate: Date = new Date();
  maxDate: Date = new Date();
  startDate: Date = new Date();
  endDate: Date = new Date();

  opacityValue = 0.7;
  showLegend = false;

  downloadingData: boolean = false;
  downloadBtnDebounce: number = 1000;

  // Variables for chart
  dataDownloaded: boolean = false;
  @Input() chartData: Array<any> = [
    {
      data: [],
      label: ''
    }
  ];
  public chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      xAxes: [{
        type: 'time',
        time: {
          unit: 'month',  // default: MMM YYYY
          parser: "MM-DD-YYYY",
          displayFormats: {
            month: 'MM-YYYY'
          }
        }
      }]
    }
  };
  public chartColors: Array<any> = [
    {
      // cyan
      backgroundColor: 'rgba(0,255,255,0.2)',
      borderColor: 'rgba(0,255,255,1)',
      pointBackgroundColor: 'rgba(0,255,255,1)',
      pointBorderColor: '#00FFFF',
      pointHoverBackgroundColor: '#00FFFF',
      pointHoverBorderColor: 'rgba(0,255,255,0.8)',
      lineTension: 0
    }
  ];
  public chartLegend: boolean = true;
  public chartType: string = 'line';

  chartHover(event: any): void {
    console.log(event);
  }

  tsSub: Subscription;
  tsTicker = 1;

  topoMap = tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
    detectRetina: true,
    attribution: 'Tiles &copy; Esri'
  });

  esriImagery = tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    detectRetina: true,
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  });
  streetMaps = tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    detectRetina: true,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  layersControl = {
    baseLayers: {
      'Imagery Maps': this.esriImagery,
      'Street Maps': this.streetMaps,
      'Topographic Maps': this.topoMap
    }
  };

  tileLayer: string = this.mapService.mainTileLayer;  // uses same tileLayer as main map
  mapLayer = this.layersControl.baseLayers[this.tileLayer];

  options = {
    layers: [this.mapLayer],
    zoomControl: false,
    zoom: 6,
    center: latLng([this.lat_0, this.lng_0])
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private locationService: LocationService,
    private mapService: MapService,
    private bottomSheet: MatBottomSheet,
    private images: LocationImagesService,
    private downloader: DownloaderService,
    private user: UserService,
    private authService: AuthService,
    private configService: ConfigService,
    private envService: EnvService,
    private messageDialog: MatDialog,
  ) { }

  ngOnInit() {

    if (!this.authService.checkUserAuthentication()) { return; }

    this.imageCollection = null;
    this.route.params.subscribe(
      params =>
        (this.locations =
          params['locations'] != undefined
            ? params['locations'].split(',').map(id => this.locationService.getLocationByID(id))
            : this.locationService.getStaticLocations())
    );
    this.route.params.subscribe(
      params =>
        (this.current_location =
          params['location'] != undefined ? this.locationService.getLocationByID(params['location']) : this.locations[0])
    );
    if (this.locations != undefined && this.current_location != undefined) {
      this.current_location_index =
        this.locations.indexOf(this.current_location) > 0 ? this.locations.indexOf(this.current_location) + 1 : 1;
    } else {
      this.current_location_index = 1;
    }
    this.getImages();
    this.downloadTimeSeries();

    let locId = this.current_location.id;
    this.locationService.getLocations('').subscribe(locations => {
      let location = locations.find(locObj => locObj.id == locId);  // finds matching location from locations array
      this.current_location.notes = location.notes;
    });

    let self = this;
    let timeout = this.tsTicker * 1000;
    setTimeout(function() {
      self.tsSub.unsubscribe();
      if (!self.dataDownloaded) {
        self.downloadTimeSeries();
      } else {
        self.tsTicker = 1;
      }
    }, timeout);
  }

  ngOnDestroy() {
    this.clearLayerImages();

    // reset location cell/date to latest image
    this.locationService.resetLocationsLatestData();
  }

  removeThumbHighlights() {
    let thumbs = document.getElementsByClassName('details_thumb');
    let thumbsParent = document.getElementsByClassName('details_thumb_parent');  // NOTE: this parent div is getting the 'selected' class sometimes but not sure why yet
    for (let i = 0; i < thumbs.length; i++) {
      let thumb = thumbs.item(i);
      thumb.classList.remove('selected');
      thumbsParent.item(i).classList.remove('selected');
    }
    return thumbs;
  }

  highlightFirstThumb() {
    /*
    Highlights first thumbnail and loads image when location-details is initialized.
    */
    setTimeout(() => {
      let thumbs = this.removeThumbHighlights();
      if (thumbs.length > 0) {
        this.toggleImage(thumbs[0], this.locationThumbs[0]);
      }
    }, 1000);
  }

  getImages(): void {
    this.loading = true;
    this.clearImages();
    let coords = this.locationService.convertToDegrees(this.current_location);
    let self = this;
    this.imageSub = this.images
      .getImageDetails(coords.latitude, coords.longitude, this.locationService.getDataType())
      .subscribe(
        (data: ImageDetails[]) => {
          self.imageCollection = data;
          self.loading = false;
          self.setImages();
        },
        error => {
          this.imageCollection = null;
          self.loading = false;
          console.error("error get images", error);
        }
      );
  }

  setImages() {
    if (this.imageCollection.length != null) {
      this.locationPNGs = this.imageCollection.filter((img: ImageDetails) => {
        return img.format == 'PNG' && img.thumb == false;
      });
      this.locationTIFFs = this.imageCollection.filter((img: ImageDetails) => {
        return img.format == 'TIFF';
      });
      this.locationThumbs = this.imageCollection.filter((img: ImageDetails) => {
        return img.thumb == true;
      });
      this.filteredPNGs = this.imageCollection.filter((img: ImageDetails) => {
        return img.format == 'PNG' && img.thumb == false;
      });
      this.highlightFirstThumb();  // initiates selecting first image once thumbnails load
    }
  }

  clearImages(): void {
    this.locationPNGs = null;
    this.locationTIFFs = null;
    this.locationThumbs = null;
    this.imageCollection = null;
  }

  toggleSlideShow() {
    let delay = 2000; // 2 seconds
    if (this.slidershow && this.router.isActive('locationdetails', false)) {
      let self = this;
      setTimeout(function() {
        self.cycleImages();
      }, delay);
    }
  }

  getImageUrl(imageName: string) {
    return this.envService.config.tomcatApiUrl + "location/images/" + imageName;
  }

  cycleImages() {
    if (this.tabGroup.selectedIndex != 0) {
      // switched away from Overview tab, disable slide show
      this.slidershow = false;
      return
    }

    let thumbs = this.removeThumbHighlights();
    let map = this.mapService.getMinimap();
    let layerOptions = {
      opacity: this.opacityValue
    };

    this.selectedLayerIndex = this.selectedLayerIndex == 0 ? this.locationPNGs.length - 1 : this.selectedLayerIndex - 1;

    if (isNaN(this.selectedLayerIndex) || this.selectedLayerIndex < 0) {
      return;
    }
    let pngImage = this.locationPNGs[this.selectedLayerIndex];
    this.selectedLayer = pngImage;
    this.updateDetails(this.selectedLayerIndex);
    let imageURL = this.getImageUrl(pngImage.name);
    let topLeft = latLng(pngImage.coordinates['topRightX'], pngImage.coordinates['topRightY']);
    let bottomRight = latLng(pngImage.coordinates['bottomLeftX'], pngImage.coordinates['bottomLeftY']);
    let imageBounds = latLngBounds(bottomRight, topLeft);
    let newLayer = new ImageOverlay(imageURL, imageBounds, layerOptions);
    this.layer.removeFrom(map);
    this.layer = newLayer;
    this.layer.addTo(map);
    let self = this;
    setTimeout(function() {
      if (self.router.isActive('locationdetails', false)) {
        thumbs[self.selectedLayerIndex].classList.add('selected');
        thumbs[self.selectedLayerIndex].scrollIntoView();
      }
    }, 100);
    this.toggleSlideShow();
  }

  updateDetails(selectedIndex) {
    /*
    Updates current location's data for slideshow.
   */
    if (!this.authService.checkUserAuthentication()) { return; }
    if (selectedIndex == undefined || selectedIndex < 0) { return; }
    let locationDataArray = this.downloader.locationsData[this.current_location.id].requestData.outputs;
    let locationData = locationDataArray[selectedIndex];
    let prevData = locationDataArray.length > selectedIndex ? locationDataArray[selectedIndex + 1] : null;

    this.locationService.setLocationDataFromOutput(this.current_location, locationData, prevData)
    this.getColor(this.current_location, prevData != null);  // updates arrow and cyano change color
    this.getArrow(this.current_location);  // updates arrow

    if (this.selectedLayer != undefined) {
      this.getImageDate();  // updates image date
      this.getImageName();  // updates image name
      this.mapService.setMiniMarker(this.mapService.createMarker(this.current_location));  // updates marker on minimap
    }
  }

  clearLayerImages() {
    if (!this.authService.checkUserAuthentication()) { return; }
    this.removeThumbHighlights();
    this.selectedLayer = null;
    this.selectedLayerIndex = null;
    if (this.layer) {
      let map = this.mapService.getMinimap();
      this.layer.removeFrom(map);
    }
    this.layer = null;
    this.slidershow = false;
  }

  toggleImage(thumbDiv: any, image: ImageDetails) {
    if (!this.authService.checkUserAuthentication()) { return; }
    this.removeThumbHighlights();
    let self = this;
    self.selectedLayerIndex = 0;
    let pngImage;
    this.locationPNGs.map(function(png) {
      if (image.name === png.thumbDependencyImageName) {
        pngImage = png;
      }
    })[0];
    this.selectedLayerIndex = this.locationPNGs.indexOf(pngImage);
    let imageURL = this.getImageUrl(pngImage.name);
    let topLeft = latLng(pngImage.coordinates['topRightX'], pngImage.coordinates['topRightY']);
    let bottomRight = latLng(pngImage.coordinates['bottomLeftX'], pngImage.coordinates['bottomLeftY']);
    let imageBounds = latLngBounds(bottomRight, topLeft);
    let map = this.mapService.getMinimap();
    let layerOptions = {
      opacity: this.opacityValue
    };

    let newLayer = new ImageOverlay(imageURL, imageBounds, layerOptions);
    if (this.selectedLayer == null) {
      this.selectedLayer = pngImage;
      this.layer = newLayer;
      this.layer.addTo(map);
      map.flyTo(this.mapService.getLatLng(this.current_location));
      thumbDiv.classList.add('selected');
    }
    else if (this.selectedLayer == pngImage) {
      this.selectedLayer = null;
      this.selectedLayerIndex = null;
      this.slidershow = false;
      this.layer.removeFrom(map);
      this.layer = null;
      map.flyTo(this.mapService.getLatLng(this.current_location));
    }
    else {
      this.selectedLayer = pngImage;
      this.layer.removeFrom(map);
      this.layer = newLayer;
      this.layer.addTo(map);
      map.flyTo(this.mapService.getLatLng(this.current_location));
      thumbDiv.classList.add('selected');
    }
    this.updateDetails(this.selectedLayerIndex);
  }

  getImageTitle(image: ImageDetails): string {
    if (!image) {
      return "";
    }
    let dateStr = image.name.split('.')[0].substring(1);
    let title = image.name.charAt(0);
    let date = null;
    if (image.satelliteImageFrequency == 'Daily') {
      let year = dateStr.substring(0, 4);
      let day = dateStr.substring(4, 7);
      date = new Date(year);
      date.setDate(date.getDate() + Number(day));
      title = title + ' ' + date.toLocaleDateString();
    } else {
      // let year1 = dateStr.substring(0, 4);
      // let day1 = dateStr.substring(4, 7);
      let year2 = dateStr.substring(7, 11);
      let day2 = dateStr.substring(11, 14);
      date = new Date(year2);
      date.setDate(date.getDate() + Number(day2));
      title = title + ' ' + date.toLocaleDateString();
    }
    let today = new Date();
    if (this.minDate == today) {
      this.startDate = date;
      this.minDate = date;
    }
    if (date < this.minDate) {
      this.startDate = date;
      this.minDate = date;
    }

    return title;
  }

  getImageName(): string {
    return this.selectedLayer.name.split('.')[0];
  }

  getImageDate(): string {
    let title = this.getImageTitle(this.selectedLayer);
    return title.split(' ')[1];
  }

  getImageDate2(image: ImageDetails): string {
    return this.getImageTitle(image).split(' ')[1];
  }

  changeOpacity(event: any): void {
    this.layer.setOpacity(event.value);
  }

  updateFilter(): void {
    let self = this;
    let filtered = [];
    this.locationPNGs.map((image: ImageDetails) => {
      let date = new Date(self.getImageTitle(image).split(' ')[1]);
      if (self.startDate <= date && self.endDate >= date) {
        filtered.push(image);
      }
    });
    this.filteredPNGs = filtered;
  }

  downloadImage(event: any, image: ImageDetails): void {
    if (!this.authService.checkUserAuthentication()) { return; }
    let tifName = image.name.split('.png')[0] + '.tif';
    let imageURL = this.getImageUrl(tifName);
    window.open(imageURL, '_blank');
  }

  downloadTimeSeries() {
    this.locationService.downloadLocation(this.current_location);
    this.chartData = [];
    let self = this;
    this.tsSub = this.downloader.getTimeSeries().subscribe((rawData: RawData[]) => {
      if (Object.keys(rawData).length === 0) {
        return;
      }
      let data = rawData[self.current_location.id].requestData;
      let timeSeriesData = [];
      data.outputs.map(timestep => {
        // Builds data var like [{x: '', y: ''}, {}...]
        let datum = {
          x: timestep.imageDate.split(' ')[0],
          y: timestep.cellConcentration
        };
        timeSeriesData.push(datum);
      });
      // Adds time series line to chart:
      this.chartData.push({
        data: timeSeriesData,
        label: 'Cell Concentration'
      });
      this.dataDownloaded = true;
    });
  }

  previousLocation(): void {
    if (!this.authService.checkUserAuthentication()) { return; }
    this.current_location_index = this.current_location_index == 1 ? this.locations.length : this.current_location_index - 1;
    this.current_location = this.locations[this.current_location_index - 1];
    this.changeMarker();
    this.getImages();
    this.clearImages();

    this.dataDownloaded = false;
    this.downloadTimeSeries();
    let self = this;
    let timeout = this.tsTicker * 1000;
    setTimeout(function() {
      self.tsSub.unsubscribe();
      if (!self.dataDownloaded) {
        self.downloadTimeSeries();
      } else {
        self.tsTicker = 1;
      }
    }, timeout);
  }

  nextLocation(): void {
    if (!this.authService.checkUserAuthentication()) { return; }
    this.current_location_index = this.current_location_index == this.locations.length ? 1 : this.current_location_index + 1;
    this.current_location = this.locations[this.current_location_index - 1];
    this.changeMarker();
    this.getImages();
    this.clearImages();

    this.dataDownloaded = false;
    this.downloadTimeSeries();
    let self = this;
    let timeout = this.tsTicker * 1000;
    setTimeout(function() {
      self.tsSub.unsubscribe();
      if (!self.dataDownloaded) {
        self.downloadTimeSeries();
      } else {
        self.tsTicker = 1;
      }
    }, timeout);
  }

  exit(): void {
    this.router.navigate(['/mylocations']);
  }

  toggleLegend(): void {
    this.showLegend = !this.showLegend;
  }

  onMapReady(map: Map): void {
    let marker = this.mapService.createMarker(this.current_location);
    this.mapService.setMinimap(map, marker);
    setTimeout(() => {
      map.invalidateSize();
      map.flyTo(this.mapService.getLatLng(this.current_location));
    }, 200);
  }

  changeMarker(): void {
    this.mapService.setMiniMarker(this.mapService.createMarker(this.current_location));
    this.mapService.getMinimap().flyTo(this.mapService.getLatLng(this.current_location), 6);
  }

  getArrow(l: Location) {
    return this.locationService.getArrow(l);
  }

  getColor(l: Location, delta: boolean) {
    let color = this.locationService.getColor(l, delta);  // gets color based on user's settings
    return this.configService.getColorRgbValue(color);
  }

  formatNumber(n: number) {
    return this.locationService.formatNumber(n);
  }

  getPercentage(l: Location) {
    return this.locationService.getPercentage(l);
  }

  getArrowColor(l: Location, delta: boolean) {
    const color = this.locationService.getColor(l, delta);
    if (color === "green") {
      return "green";
    }
    if (color === "yellow") {
      return "yellow";
    }
    if (color === "orange") {
      return "orange";
    }
    if (color === "red") {
      return "red";
    }
  }

  addMarkerOnClick(e: any): void {
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

  openNotes(l: Location): void {
    this.bottomSheet.open(LocationDetailsNotes, {
      data: {
        location: l
      }
    });
  }

  downloadChartCSV(): void {
    /*
    Initiates bloom chart CSV download.
    */
    if (!this.authService.checkUserAuthentication()) { return; }

    if (this.downloadingData === true) { return; }

    this.downloadingData = true;
    setTimeout(() => {
      this.downloadingData = false
    }, this.downloadBtnDebounce);  // disables dl btn temporarily

    let chartData = this.curateChartData(this.chartData);
    this.downloadFile(chartData);
  }

  curateChartData(chartData: Array<any>): Array<any> {
    /*
    Gets data from chart data for CSV download.
    */
    let dataSets = [];
    let csvArray = [];

    for (let dataIndex in chartData) {
      dataSets.push(chartData[dataIndex]['data']);
    }

    // Assumes single dataset:
    dataSets[0].forEach((item, index) => {
      csvArray.push({'date': item.x, 'concentration': item.y})
    });

    // Handles multiple datasets (e.g., location-compare-details):
    // for (let dataIndex in chartData) {
    //   dataSets.push(chartData[dataIndex]['data']);
    // }
    // // Handles multiple datasets (cols: x1, y1, x2, y2):
    // this.zip(dataSets).forEach((item, index) => {
    //   csvArray.push({'date': item[0].x, 'concentration': item[0].y})
    // });

    // Returns data array by earliest date first
    return csvArray.reverse();
  }

  downloadFile(data: any) {
    /*
    Creates CSV link and clicks it for downloading.
    */
    const filename = 'CellConcentration' +
      this.current_location.name.replace(/\s/g, '').replace('--', '') +
      '.csv';
    const replacer = (key, value) => (value === null ? '' : value); // specify how you want to handle null values here
    const header = Object.keys(data[0]);
    const csv = data.map((row) =>
      header
        .map((fieldName) => JSON.stringify(row[fieldName], replacer))
        .join(',')
    );
    csv.unshift(header.join(','));
    const csvArray = csv.join('\r\n');

    const a = document.createElement('a');
    const blob = new Blob([csvArray], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  }

  /*
  Simulates python "zip" function
  */
  zip= rows=>rows[0].map((_,c)=>rows.map(row=>row[c]));

  displayMessageDialog(message: string) {
    /*
    Displays dialog messages to user.
    */
    this.messageDialog.open(DialogComponent, {
      data: {
        dialogMessage: message
      }
    });
  }

}


@Component({
  selector: 'location-details-notes',
  templateUrl: 'location-details-notes.html'
})
export class LocationDetailsNotes {

  addingNote: boolean = false;
  preAddNote: boolean = true;  // Add btn before loading Add/Cancel/Textbox content

  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
              private datePipe: DatePipe,
              private locationService: LocationService) {
  }

  ngOnInit() {
    // Loads selected location's notes upon component initialization
  }

  openLink(event: MouseEvent): void {
    // this.bottomSheetRef.dismiss();
    event.preventDefault();
  }

  displayAddNote(): void {
    /*
     Displays textarea and cancel button for adding a note
     while in the notes view.
     */
    this.addingNote = true;
    this.preAddNote = false;
  }

  hideAddNote(): void {
    /*
     Hides textarea and cancel button for adding a note
     while in the notes view.
     */
    this.addingNote = false;
    this.preAddNote = true;
  }

  addNote(l: Location): void {
    /*
     Adds the note entered in the note bottom sheet.
     */
    let noteTextbox = <HTMLInputElement>document.getElementById('note-textarea');  // NOTE: casted as HTMLInputElement to make Typescript happy
    let dateTime = this.datePipe.transform(new Date(), 'yyyy-MM-dd HH:mm:ss');
    let noteObj = {
      timestamp: dateTime,
      note: noteTextbox.value
    };
    noteTextbox.value = "";  // clears textbox
    noteObj.note = noteObj.note.replace(/\r?\n|\r/g, '');  // remove any newlines
    l.notes.push(noteObj);
    this.locationService.updateLocation(l.name, l);  // adds note to location in db
  }

}
