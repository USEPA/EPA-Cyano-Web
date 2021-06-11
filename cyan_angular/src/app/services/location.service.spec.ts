import { TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { of, Observable } from 'rxjs';
import * as L from 'leaflet';

import { LocationType } from '../models/location';
import { MockLocation } from '../../testing/mocks/location';
import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { UserService } from './user.service';
import { MapService } from './map.service';
import { LocationService } from './location.service';

let rawDataJson = require('../../testing/mocks/raw-data-response.json');



describe('LocationService', () => {

	let service: LocationService;
	let mapService: MapService;
	let testMap;
	let testLocation: MockLocation = new MockLocation();
	let testLocationType = LocationType;
	let testUser = {
	  username: 'testuser',
	  email: 'test@test.test',
	  auth_token: 'someauthtoken',
	  sessionCountDown: 0
	};
	let dataPoint =  {
	  imageDateLong: 0,
	  imageDate: '',
	  satelliteImageType: '',
	  satelliteImageFrequency: '',
	  cellConcentration: 0,
	  maxCellConcentration: 0,
	  latitude: 0,
	  longitude: 0,
	  validCellsCount: 0
	};
	let testCoordinates = {
	  latDeg: 0,
	  latMin: 0,
	  latSec: 0,
	  latDir: 'string',
	  lngDeg: 0,
	  lngMin: 0,
	  lngSec: 0,
	  lngDir: 'string'
	};

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [
				HttpClientModule
			],
			providers: [
				AuthService,
				LoaderService,
				CyanMap,
				{
					provide: UserService,
					useClass: MockUserService
				}
			]
		});
		service = TestBed.get(LocationService);
		mapService = TestBed.get(MapService);
		let mapDomObj = document.createElement('div');
	    mapDomObj.classList.add('map');
	    testMap = L.map(mapDomObj, {center: [34, -81], zoom: 12});
	    mapService.setMap(testMap);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('should test setDataType() - refreshes data', () => {
		testLocation.type = 1;
		let refreshSpy = spyOn(service, 'refreshData');

		service.setDataType(2);

		expect(refreshSpy).toHaveBeenCalled();
	});

	it('should test clearUserData()', () => {
		service.locations = [testLocation];
		service.compare_locations = [testLocation];
		let mapSpy = spyOn<any>(service['mapService'], 'deleteMarker');
		spyOn<any>(service['downloader'], 'locationsData');

		service.clearUserData();

		expect(service.locations.length).toEqual(0);
		expect(service.compare_locations.length).toEqual(0);
		expect(mapSpy).toHaveBeenCalled();
	});

	it('should test refreshData()', () => {
		spyOn(service, 'clearUserData');
		let userLocSpy = spyOn(service, 'getUserLocations');
		spyOn<any>(service['downloader'], 'getUserLocations')
			.and.returnValue(of([testLocation]));

		service.refreshData();

		expect(userLocSpy).toHaveBeenCalled();
	});

	it('should test getDataType()', () => {
		let result = service.getDataType();

		expect(result).toEqual(0);
	});

	it('should test loadUser', () => {
		spyOn(service, 'getUserLocations');
		let userSpy = spyOn<any>(service['user'], 'getUserDetails')
			.and.returnValue(of(testUser));

		service.loadUser();

		expect(userSpy).toHaveBeenCalled();
	});

	it('should test getUserLocations()', () => {
		spyOn<any>(service['loaderService'], 'showProgressBar');
		spyOn(service, 'locationIDCheck')
			.and.returnValue(false);
		spyOn(service, 'downloadLocation');
		spyOn(service, 'addMarkers');
		spyOn(service, 'updateCompareList');
		service.locations = [];

		service.getUserLocations();

		expect(service.locations.length).toBeGreaterThan(0);
	});

	it('should test locationIDCheck() - not in locations', () => {
		let result = service.locationIDCheck(9999);

		expect(result).toBe(false);
	});

	it('should test locationIDCheck() - in locations', () => {
		service.locations = [testLocation];
		let result = service.locationIDCheck(testLocation.id);

		expect(result).toBe(true);
	});

	it('should test getAllLocations()', () => {
		service.locations = [testLocation];

		service.getAllLocations().subscribe(locations => {
			expect(locations.length).toEqual(1);
		});
	});

	it('should test resetLocationsLatestData()', () => {
		service.locations = [testLocation];
		let spy = spyOn(service, 'setLocationDataFromOutput');
		service['downloader']['locationsData'] = rawDataJson;

		service.resetLocationsLatestData();

		expect(spy).toHaveBeenCalled();
	});

	it('should test setLocationDataFromOutput()', () => {
		service.setLocationDataFromOutput(testLocation, dataPoint, null);

		expect(testLocation.changeDate).toMatch('N/A');
	});

	it('should test downloadLocation()', () => {
		let ajaxSpy = spyOn<any>(service['downloader'], 'getAjaxData');

		service.downloadLocation(testLocation);

		expect(ajaxSpy).toHaveBeenCalled();
	});

	// it('should test getData()', () => {
	// 	spyOn<any>(service['downloader'], 'getData')
	// 		.and.returnValue(of([testLocation]));
	// 	spyOn<any>(service['downloader'], 'locationsChanged')
	// 		.and.returnValue(of(testLocation));
	// 	spyOn<any>(service['mapService'], 'updateMarker');
	// 	spyOn(service, 'updateCompareLocation');
	// 	let downSpy = spyOn<any>(service['downloader'], 'updateProgressBar');

	// 	service.getData();

	// 	expect(downSpy).toHaveBeenCalled();
	// });

	it('should test getLocationData()', () => {
		service.locations = [testLocation];

		service.getLocationData().subscribe(locations => {
			expect(service.locations.length).toBeGreaterThan(0);
		})
	});

	it('should test getLocations()', () => {
		service.locations = [testLocation];

		let result = service.getLocations('');

		expect(service.locations.length).toBeGreaterThan(0);
	});

	it('should test getStaticLocations()', () => {
		service.locations = [testLocation];

		let result = service.getStaticLocations();

		expect(service.locations.length).toBeGreaterThan(0);
	});

	it('should test getLocationByID()', () => {
		service.locations = [testLocation];

		let result = service.getLocationByID(testLocation.id);

		expect(result.id).toEqual(testLocation.id);
	});

	it('should test createLocation() - id gets incremented', () => {
		spyOn(service, 'convertCoordinates')
			.and.returnValue(testCoordinates);
		spyOn(service, 'getLastID')
			.and.returnValue(1);
		spyOn(service, 'getDataType')
			.and.returnValue(1);
		spyOn<any>(service['downloader'], 'addUserLocation');

		let result = service.createLocation(
				testLocation.name, testLocation.latitude,
				testLocation.longitude, testLocation.cellConcentration, testLocation.maxCellConcentration,
				testLocation.concentrationChange, testLocation.dataDate, testLocation.source);

		expect(result.id).toBeGreaterThan(testLocation.id);
	});

	it('should test deleteLocation', () => {
		service.locations = [testLocation];
		spyOn(service, 'deleteCompareLocation');
		spyOn<any>(service['downloader'], 'deleteUserLocation');

		service.deleteLocation(testLocation);

		expect(service.locations.length).toEqual(0);
	});

	it('should test updateLocation', () => {
		service.locations = [testLocation];
		let spy = spyOn<any>(service['downloader'], 'updateUserLocation');

		service.updateLocation(testLocation.name, testLocation);

		expect(spy).toHaveBeenCalled();
	});

	it('should test updateCompareList()', () => {
		let subjectSpy = spyOn<any>(service['compareLocationsSource'], 'next');

		service.updateCompareList();

		expect(subjectSpy).toHaveBeenCalled();
	});

	it('should test getCompareLocations()', () => {
		service.compare_locations = [testLocation];
		service.getCompareLocations().subscribe(compare_locations => {
			expect(compare_locations.length).toEqual(service.compare_locations.length);
		});
	});

	it('should test addCompareLocation() - location gets added', () => {
		service.compare_locations = [testLocation];
		let newLoc = new MockLocation();
		newLoc.id = 2;
		spyOn(service, 'updateLocation');

		service.addCompareLocation(newLoc);

		expect(service.compare_locations.length).toEqual(2);
	});

	it('should test updateCompareLocation()', () => {
		const newName = 'New Location Name'
		service.compare_locations = [testLocation];
		let newLoc = new MockLocation();
		newLoc.id = 1;
		newLoc.name = newName;
		spyOn(service, 'updateLocation');

		service.updateCompareLocation(newLoc);

		expect(service.compare_locations[0].name).toMatch(newName);
	});

	it('should test deleteCompareLocation()', () => {
		service.compare_locations = [testLocation];
		let spy = spyOn(service, 'updateLocation');

		service.deleteCompareLocation(testLocation);

		expect(service.compare_locations.length).toEqual(0);
	});

	it('should test convertCoordinates()', () => {
		let result = service.convertCoordinates(testLocation.latitude, testLocation.longitude);

		expect(result.latDir).toMatch(testLocation.latitude_dir);
	});

	it('should test convertToDegrees()', () => {
		let result = service.convertToDegrees(testLocation);

		expect(result.latitude).toEqual(testLocation.latitude);
		expect(result.longitude).toEqual(testLocation.longitude);
	});

	it('should test getLastID()', () => {
		service.locations = [testLocation];

		let result = service.getLastID();

		expect(result).toEqual(testLocation.id);
	});

	it('should test getPercentage', () => {
    const testPercentage: number = 0;

    let result = service.getPercentage(testLocation);

    expect(result).toBeDefined();
  });

  it('should test getPercentage2', () => {
    let result = service.getPercentage2(testLocation);

    expect(result).toEqual(1);
  });

  it('should test getColor', () => {
    const testDelta = false;

    let result = service.getColor(testLocation, testDelta);

    expect(result).toContain('green');

  });

  it('should test getArrow()', () => {
  	let result = service.getArrow(testLocation);

  	expect(result).toBe(false);
  });

  it('should test exceedAlertValue()', () => {
  	let result = service.exceedAlertValue(testLocation);

  	expect(result).toBe(false);
  });

  it('should test formatNumber()', () => {
  	const testNum = 1;
  	let result = service.formatNumber(testNum);

  	expect(result).toMatch(testNum.toString());
  });

  it('should test setMarked()', () => {
  	let spy = spyOn<any>(service['downloader'], 'updateUserLocation');

  	service.setMarked(testLocation, true);

  	expect(spy).toHaveBeenCalled();
  });

  // it('should test addMarkers()', () => {
  // 	spyOn<any>(service['mapService'], 'hasMarker')
  // 		.and.returnValue(false);
  // 	let spy = spyOn<any>(service['mapService'], 'addMarker')

  // 	service.addMarkers();

  // 	expect(spy).toHaveBeenCalled();
  // });

  // it('should test updateMarkers()', () => {
  // 	spyOn<any>(service['mapService'], 'hasMarker')
  // 		.and.returnValue(false);
  // 	let spy = spyOn<any>(service['mapService'], 'updateMarker')

  // 	service.updateMarkers();

  // 	expect(spy).toHaveBeenCalled();
  // });

});

class MockUserService {
	testUser = {
	  username: 'testuser',
	  email: 'test@test.test',
	  auth_token: 'someauthtoken',
	  sessionCountDown: 0
	};
	currentAccount = {
		locations: [new MockLocation()]
	};
	getUserName() {
		return '';
	}
	getUserSettings() {
		return {
	    level_low: 0,
	    level_medium: 5,
	    level_high: 10,
	    enable_alert: false,
	    alert_value: 5
		};
	}
	getUserDetails() {
		return of(this.testUser);
	}
	getUserLocations() {
		return of([new MockLocation()]);
	}
}

class MockDownloader {
  locationsData = rawDataJson;
}
