import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material';
import { latLng, latLngBounds, tileLayer, marker, icon, Map, Layer, Marker, ImageOverlay, LayerGroup } from 'leaflet';
import { Subscription } from 'rxjs';

import { MapService } from '../services/map.service';
import { Location } from '../models/location';
import { LocationService } from '../services/location.service';
import { LocationImagesService } from '../services/location-images.service';
import { ImageDetails } from '../models/image-details';
import { DownloaderService, RawData } from '../services/downloader.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-location-compare-details',
  templateUrl: './location-compare-details.component.html',
  styleUrls: ['./location-compare-details.component.css']
})
export class LocationCompareDetailsComponent implements OnInit {

  currentLocaitonData: RawData;
  imageCollection: ImageDetails[];
  locationThumbs: ImageDetails[];
  locationTIFFs: ImageDetails[];
  locationPNGs: ImageDetails[];

  filteredPNGs: ImageDetails[];

  lat_0: number = 33.927945;
  lng_0: number = -83.346554;

  current_location: Location;
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

  loadTicker = 1;
  opacityValue = 0.7;

  showMap = false;

  // Variables for chart
  dataDownloaded: boolean = false;
  @Input() chartData: Array<any> = [];
  public chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
    	xAxes: [{
    		type: "time",
    		time: { parser: "MM-DD-YYYY" }
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
      pointHoverBorderColor: 'rgba(0,255,255,0.8)'
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

  options = {
    layers: [this.topoMap],
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
    private user: UserService
  ) {}

  ngOnInit() {

  	console.log("Initializing location-compare-details component.");

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

    // Gets time series data and plots it for each location:
   	this.locations.forEach(location => {
   		this.downloadTimeSeries(location);
   	});

    let self = this;
    let timeout = this.tsTicker * 1000;
    setTimeout(function() {
      self.tsSub.unsubscribe();
      if (!self.dataDownloaded) {
        self.downloadTimeSeries(this.current_location);
      } else {
        self.tsTicker = 1;
      }
    }, timeout);
  }

  downloadTimeSeries(l: Location) {
    let coord = this.locationService.convertToDegrees(l);
    let username = this.user.getUserName();
    this.downloader.getAjaxData(
      l.id,
      username,
      l.name,
      l.marked,
      coord.latitude,
      coord.longitude,
      false
    );

    this.tsSub = this.downloader.getTimeSeries().subscribe((rawData: RawData[]) => {
      let data = rawData[l.id].requestData;
      let timeSeriesData = [];

      console.log("Adding time series data to chart.");
      data.outputs.map(timestep => {
        if (timestep.satelliteImageFrequency == 'Weekly') {
          // Builds data var like [{x: '', y: ''}, {}...]
          let datum = {
            x: timestep.imageDate.split(' ')[0],
            y: timestep.cellConcentration
          };
          timeSeriesData.push(datum);
        }
      });

      // Adds time series line to chart:
      this.chartData.push({
      	data: timeSeriesData,
      	label: l.name
      });

      this.dataDownloaded = true;
    });
  }

  displayMap($event): void {
  	if ($event.index == 2) {
  		this.showMap = true;
  	}
  	else {
  		this.showMap = false;
  	}
  }

  onMapReady(map: Map): void {
    let markerArray = [];
    let latLngArray = [];
    map.invalidateSize();  // will this fix the gray map?
    this.mapService.setMinimap(map, null);
    this.locations.forEach(loc => {
      let marker = this.createMarker(loc);
      this.mapService.setMiniMarkerForCompare(marker);
      latLngArray.push(this.mapService.getLatLng(loc));
    });
    setTimeout(() => {
      map.invalidateSize();
      map.flyToBounds(latLngArray);
    }, 200);
  }

  createMarker(loc: Location): Marker {
    let m = marker(this.mapService.getLatLng(loc), {
      icon: icon({
        iconSize: [30, 36],
        iconAnchor: [13, 41],
        iconUrl: this.mapService.getMarker(loc),
        shadowUrl: 'leaflet/marker-shadow.png'
      }),
      title: loc.name,
      riseOnHover: true,
      zIndexOffset: 10000
    });
    return m;
  }

  getArrow(l: Location) {
    return this.locationService.getArrow(l);
  }
  getColor(l: Location, delta: boolean) {
    return this.locationService.getColor(l, delta);
  }
  formatNumber(n: number) {
    return this.locationService.formatNumber(n);
  }
  getPercentage(l: Location) {
    return this.locationService.getPercentage(l);
  }

}
