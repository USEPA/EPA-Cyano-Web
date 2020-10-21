import { Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { latLng, latLngBounds, tileLayer, marker, icon, Map, Layer, Marker, ImageOverlay, LayerGroup } from 'leaflet';

import { LocationService } from '../services/location.service';
import { LocationImagesService } from '../services/location-images.service';
import { MapService } from '../services/map.service';
import { AuthService } from '../services/auth.service';

import { environment } from '../../environments/environment';
import { Location } from '../models/location';
import { ImageDetails } from '../models/image-details';

@Component({
	selector: 'app-latest-image',
	templateUrl: './latest-image.component.html',
	styleUrls: ['./latest-image.component.css']
})
export class LatestImageComponent implements OnInit {

	baseURL: string = environment.tomcatApiUrl + "location/images/";

	location: Location;

	latestImageDate: string;

	imageSub: Subscription;

	loading: boolean = false;

	imageCollection: ImageDetails[];
	locationThumbs: ImageDetails[];
	locationTIFFs: ImageDetails[];
	locationPNGs: ImageDetails[];

	filteredPNGs: ImageDetails[];

	lat_0: number = 33.927945;
	lng_0: number = -83.346554;

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

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private locationService: LocationService,
		private images: LocationImagesService,
		private mapService: MapService,
		private authService: AuthService
	) { }

	ngOnInit() {

		if (!this.authService.checkUserAuthentication()) { return; }

		this.route.params.subscribe(
			params => {
				// Get latest image for location and overlay on map (like location-details component)
				this.location = JSON.parse(params.location);
			}
		);

		this.getImages();

	}

	exit(): void {
		// NOTE: What about going to previous destination?
		this.router.navigate(['/']);
	}

	getImages(): void {
		this.loading = true;
		this.clearImages();

		let coords = this.locationService.convertToDegrees(this.location);  // gets location in degrees
		let self = this;

		this.imageSub = this.images
			.getAllImages(coords.latitude, coords.longitude, this.locationService.getDataType())
			.subscribe((data: ImageDetails[]) => {
				this.imageCollection = data;
			});

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

				self.toggleImage(self.imageCollection[0]);  // gets latest image (assumes first item is latest), displays image over map

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

	toggleImage(image: ImageDetails) {

		if (!this.authService.checkUserAuthentication()) { return; }

		let thumbs = document.getElementsByClassName('details_thumb');
		for (let i = 0; i < thumbs.length; i++) {
			let thumb = thumbs.item(i);
			thumb.classList.remove('selected');
		}
		let self = this;
		self.selectedLayerIndex = 0;
		let pngImage;
		this.locationPNGs.map(function(png) {
			if (image.name === png.name) {
				pngImage = png;
				self.latestImageDate = self.getImageDate2(pngImage);
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
			map.setZoom(6);
			map.flyTo(this.mapService.getLatLng(this.location));
		} else if (this.selectedLayer == pngImage) {
			this.selectedLayer = null;
			this.selectedLayerIndex = null;
			this.slidershow = false;
			this.layer.removeFrom(map);
			this.layer = null;
			map.setZoom(6);
			map.flyTo(this.mapService.getLatLng(this.location));
		} else {
			this.selectedLayer = pngImage;
			this.layer.removeFrom(map);
			this.layer = newLayer;
			this.layer.addTo(map);
			map.setZoom(6);
			map.flyTo(this.mapService.getLatLng(this.location));
		}
	}

	getImageTitle(image: ImageDetails): string {
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
	getImageDate2(image: ImageDetails): string {
		return this.getImageTitle(image).split(' ')[1];
	}

	changeOpacity(event: any): void {
		this.layer.setOpacity(event.value);
	}

	onMapReady(map: Map): void {
		let marker = this.createMarker();
		this.mapService.setMinimap(map, marker);
		setTimeout(() => {
			map.invalidateSize();
			map.flyTo(this.mapService.getLatLng(this.location));
		}, 200);
	}

	createMarker(): Marker {
		let m = marker(this.mapService.getLatLng(this.location), {
			icon: icon({
				iconSize: [30, 36],
				iconAnchor: [13, 41],
				iconUrl: this.mapService.getMarker(this.location),
				shadowUrl: 'leaflet/marker-shadow.png'
			}),
			title: this.location.name,
			riseOnHover: true,
			zIndexOffset: 10000
		});
		return m;
	}

}
