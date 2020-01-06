import { Component, OnInit, Input, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material';
import { DatePipe } from '@angular/common';

import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import {MatCardModule} from '@angular/material/card';

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
	selector: 'app-location-details',
	templateUrl: './location-details.component.html',
	styleUrls: ['./location-details.component.css']
})
export class LocationDetailsComponent implements OnInit {

	baseURL: string = 'https://cyan.epa.gov/cyan/cyano/location/images/';

	currentLocaitonData: RawData;
	imageCollection: ImageDetails[];
	locationThumbs: ImageDetails[];
	locationTIFFs: ImageDetails[];
	locationPNGs: ImageDetails[];

	filteredPNGs: ImageDetails[];

	productFrequency: string = 'Weekly';

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

	loadTicker = 1;
	opacityValue = 0.7;

	// Variables for chart
	dataDownloaded: boolean = false;
	@Input() chartData: Array<any> = [
		{
			data: [],
			label: ''
		}
	];
	@Input() chartDataLabels: Array<any> = [];
	public chartOptions: any = {
		responsive: true,
		maintainAspectRatio: false
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
		this.user.getUserLocations().subscribe((userLocs) => {
			let userLoc = userLocs.find(locObj => locObj.id == locId);  // matches locId to userLocs location with same id
			this.current_location.notes = JSON.parse(userLoc.notes);
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

	getImages(): void {
		this.loading = true;
		this.clearImages();

		let coords = this.locationService.convertToDegrees(this.current_location);
		let self = this;
		this.imageSub = this.images
			.getImageDetails(coords.latitude, coords.longitude)
			.subscribe((data: ImageDetails[]) => (this.imageCollection = data));
		let timeout = this.loadTicker * 1000;
		setTimeout(function() {
			self.imageSub.unsubscribe();
			if (self.imageCollection == null) {
				self.loadTicker = self.loadTicker + 1;
				self.imageSub.unsubscribe();
				self.getImages();
			} else {
				self.loading = false;
				self.setImages();
				self.loadTicker = 1;
			}
		}, timeout);
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

	cycleImages() {
		let thumbs = document.getElementsByClassName('details_thumb');
		for (let i = 0; i < thumbs.length; i++) {
			let thumb = thumbs.item(i);
			thumb.classList.remove('selected');
		}
		let map = this.mapService.getMinimap();
		let layerOptions = {
			opacity: this.opacityValue
		};
		this.selectedLayerIndex = this.selectedLayerIndex == 0 ? this.locationPNGs.length - 1 : this.selectedLayerIndex - 1;
		let pngImage = this.locationPNGs[this.selectedLayerIndex];
		this.selectedLayer = pngImage;
		let imageURL = this.baseURL + pngImage.name;
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
			}
		}, 100);
		this.toggleSlideShow();
	}

	clearLayerImages() {
		let thumbs = document.getElementsByClassName('details_thumb');
		for (let i = 0; i < thumbs.length; i++) {
			let thumb = thumbs.item(i);
			thumb.classList.remove('selected');
		}
		this.selectedLayer = null;
		this.selectedLayerIndex = null;
		if (this.layer) {
			let map = this.mapService.getMinimap();
			this.layer.removeFrom(map);
		}
		this.layer = null;
		this.slidershow = false;
	}

	toggleImage(event: any, image: ImageDetails) {
		let thumbs = document.getElementsByClassName('details_thumb');
		for (let i = 0; i < thumbs.length; i++) {
			let thumb = thumbs.item(i);
			thumb.classList.remove('selected');
		}
		let self = this;
		self.selectedLayerIndex = 0;
		let pngImage;
		this.locationPNGs.map(function(png) {
			if (image.name === png.thumbDependencyImageName) {
				pngImage = png;
			}
		})[0];
		this.selectedLayerIndex = this.locationPNGs.indexOf(pngImage);
		let imageURL = this.baseURL + pngImage.name;
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
			map.setZoom(10);
			map.flyTo(this.mapService.getLatLng(this.current_location));
			event.path[1].classList.add('selected');
		} else if (this.selectedLayer == pngImage) {
			this.selectedLayer = null;
			this.selectedLayerIndex = null;
			this.slidershow = false;
			this.layer.removeFrom(map);
			this.layer = null;
			map.setZoom(6);
			map.flyTo(this.mapService.getLatLng(this.current_location));
		} else {
			this.selectedLayer = pngImage;
			this.layer.removeFrom(map);
			this.layer = newLayer;
			this.layer.addTo(map);
			map.setZoom(10);
			map.flyTo(this.mapService.getLatLng(this.current_location));
			event.path[1].classList.add('selected');
		}
	}

	getImageTitle(image: ImageDetails): string {
		let dateStr = image.name.split('.')[0].substring(1);
		let title = image.name.charAt(0);
		let date = null;
		if (image.satelliteImageFrequency == 'Daily') {
			let year = dateStr.substring(0, 4);
			let day = dateStr.substring(4, dateStr.length - 1);
			date = new Date(year);
			date.setDate(date.getDate() + Number(day));
			title = title + ' ' + date.toLocaleDateString();
		} else {
			let year1 = dateStr.substring(0, 4);
			let day1 = dateStr.substring(4, 7);
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
		// console.log("Filtering images by date");
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
		let tifName = image.name.split('.png')[0] + '.tif';
		let imageURL = 'https://cyan.epa.gov/cyan/cyano/location/images/' + tifName;
		window.open(imageURL, '_blank');
	}

	downloadTimeSeries() {
		let coord = this.locationService.convertToDegrees(this.current_location);
		let username = this.user.getUserName();
		this.downloader.getAjaxData(
			this.current_location.id,
			username,
			this.current_location.name,
			this.current_location.marked,
			coord.latitude,
			coord.longitude,
			false
		);
		this.chartData = [
			{
				data: [],
				label: ''
			}
		];
		this.chartDataLabels = [];
		let self = this;
		this.tsSub = this.downloader.getTimeSeries().subscribe((rawData: RawData[]) => {
			let data = rawData[self.current_location.id].requestData;
			let ts = [];
			let labels = [];
			data.outputs.map(timestep => {
				if (timestep.satelliteImageFrequency == 'Weekly') {
					ts.push(timestep.cellConcentration);
					labels.push(timestep.imageDate.split(' ')[0]);
				}
			});
			ts = ts.reverse();
			labels = labels.reverse();
			this.chartData[0].data = ts;
			this.chartData[0].label = 'Cell Concentration';
			setTimeout(function() {
				self.chartDataLabels = labels;
			}, 100);
			this.dataDownloaded = true;
		});
	}

	previousLocation(): void {
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

	onMapReady(map: Map): void {
		let marker = this.createMarker();
		this.mapService.setMinimap(map, marker);
		setTimeout(() => {
			map.invalidateSize();
			map.flyTo(this.mapService.getLatLng(this.current_location));
		}, 200);
	}

	createMarker(): Marker {
		let m = marker(this.mapService.getLatLng(this.current_location), {
			icon: icon({
				iconSize: [30, 36],
				iconAnchor: [13, 41],
				iconUrl: this.mapService.getMarker(this.current_location),
				shadowUrl: 'leaflet/marker-shadow.png'
			}),
			title: this.current_location.name,
			riseOnHover: true,
			zIndexOffset: 10000
		});
		return m;
	}

	changeMarker(): void {
		this.mapService.setMiniMarker(this.createMarker());
		this.mapService.getMinimap().flyTo(this.mapService.getLatLng(this.current_location), 6);
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

	openNotes(l: Location): void {
		this.bottomSheet.open(LocationDetailsNotes, {
			data: { 
				location: l
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

	// constructor(private bottomSheetRef: MatBottomSheetRef<LocationDetailsNotes>) {}
	constructor(
		@Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
		private datePipe: DatePipe,
		private locationService: LocationService,
		private user: UserService
	 ) {}

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
		let dateTime = this.datePipe.transform(new Date(), 'yyyy-MM-dd hh:mm:ss');
		let noteObj = {
			timestamp: dateTime,
			note: noteTextbox.value
		};
		noteTextbox.value = "";  // clears textbox
		noteObj.note = noteObj.note.replace(/\r?\n|\r/g, '');  // remove any newlines
		l.notes.push(noteObj);
		this.locationService.updateLocation(l.name, l);  // adds note to location in db

		let locId = l.id;  // gets id of selected location
		this.user.getUserLocations()
			.subscribe((userLocs) => {
				let userLoc = userLocs.find(locObj => locObj.id == locId);  // matches locId to userLocs location with same id
				let locNotes = JSON.parse(userLoc.notes);
				locNotes.push(noteObj);
				userLoc.notes = JSON.stringify(locNotes);
			}
		);

	}

}
