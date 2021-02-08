import { TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import * as L from 'leaflet';
import { Marker, LatLng } from 'leaflet';

import { MockLocation } from '../../testing/mocks/location';
import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { MapService } from './map.service';

describe('MapService', () => {

	let service: MapService;
	let testMap;
	let testLocation = new MockLocation();

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [
				HttpClientModule
			],
			providers: [
				AuthService,
				LoaderService,
				CyanMap
			]
		});
		service = TestBed.get(MapService);
		let mapDomObj = document.createElement('div');
	    mapDomObj.classList.add('map');
	    testMap = L.map(mapDomObj, {center: [34, -81], zoom: 12});
	    service.setMap(testMap);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('should test setMap()', () => {
		service.setMap(testMap);

		expect(service).toBeDefined();
	});

	it('should test setMinimap()', () => {
		let spy = spyOn(service, 'setMiniMarker');

		service.setMinimap(testMap, new Marker(new LatLng(34, -81)));

		expect(spy).toHaveBeenCalled();
	});

	it('should test setMiniMarker()', () => {
		service.setMiniMarker(undefined);

		expect(service).toBeDefined();
	});

	// it('should test setMiniMarkerForCompare()', () => {
	// 	service.setMiniMarkerForCompare(undefined);

	// 	expect(service).toBeDefined();
	// });

	it('should test getMap()', () => {
		let result = service.getMap();

		expect(typeof result === "object").toBe(true);
	});

	it('should test getMinimap()', () => {
		let result = service.getMinimap();

		expect(result).toBeUndefined();
	});

	it('should test getMarkers()', () => {
		let result = service.getMarkers();

		expect(typeof result === "object").toBe(true);
	});

	it('should test hasMarker()', () => {
		let result = service.hasMarker(testLocation.id);

		expect(result).toBe(false);
	});

	it('should test addMarker()', () => {

	});

	it('should test updateMarker()', () => {
		service.updateMarker(testLocation);

		expect(service).toBeDefined();
	});

	it('should test deleteMarker()', () => {
		// service.deleteMarker(testLocation);
	});

	it('should test getSource()', () => {
		const expectedResult = 'OLCI';
		let result = service.getSource();

		expect(expectedResult).toMatch(result);
	});

	it('should test changeSource()', () => {
		const testSource = 'MERIS';
		let result = service.changeSource(testSource);

		expect(result).toBeUndefined();
	});

	it('should test getLatLng()', () => {
		let result = service.getLatLng(testLocation);

		expect(result.lat).toEqual(testLocation.latitude);
	});

	it('should test createPopup()', () => {
		const expectedResult = '<popup-element>';

		let result = service.createPopup(testLocation);

		expect(result).toBeDefined();
	});

	it('should test getMarker()', () => {
		const colorPath = 'assets/images/map_pin_green_unchecked.png';
		const userSettings = {
	    level_low: 0,
	    level_medium: 5,
	    level_high: 10,
	    enable_alert: false,
	    alert_value: 5
		};
		spyOn<any>(service['userService'], 'getUserSettings')
			.and.returnValue(userSettings);

		let result = service.getMarker(testLocation);

		expect(result).toContain(colorPath);
	});

	it('should test convertDmsToDd()', () => {
		let result = service.convertDmsToDd(
			testLocation.latitude_deg, testLocation.latitude_min, testLocation.latitude_sec,
			testLocation.longitude_deg, testLocation.longitude_min, testLocation.longitude_sec
		);

		expect(result[0]).toEqual(testLocation.latitude);
		expect(result[1]).toEqual(-1 * testLocation.longitude);
	});

});

class MockMap {
  setView(latLon, zoom) {
    return;
  }
}

class MockMarker {
  fireEvent(event) {
    return;
  }
  removeLayer() {
  	return;
  }
  addLayer() {
  	return;
  }
}
