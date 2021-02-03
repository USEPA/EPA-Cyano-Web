import { TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { of, Subject } from 'rxjs';

import { UserSettings } from '../models/settings';
import { Comment, Reply } from '../models/comment';
import { Coordinates } from '../models/image-details';
import { MockLocation } from '../../testing/mocks/location';
import { EnvService } from '../services/env.service';
import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { DownloaderService, RawData, LocationDataAll } from './downloader.service';

let rawDataResponse = require('../../testing/mocks/raw-data-response.json');

describe('DownloaderService', () => {

	const testUser = 'testuser';
	const testEmail = 'testemail';
	const testPass = 'testpass';
	const testId = 1;
	const testType = 1;
	const testUrl = 'http://testurl/';
	let service: DownloaderService;
	let mockEnvService = {
		config: {
			baseServerUrl: testUrl
		}
	};
	let testLocation: MockLocation = new MockLocation();
	let testSettings: UserSettings = {
    level_low: 0,
    level_medium: 5,
    level_high: 10,
    enable_alert: false,
    alert_value: 5
  };
  let testComment: Comment = {
  	id: 1,
  	title: 'title',
  	date: 'date',
  	username: 'username',
  	device: 'device',
  	browser: 'browser',
  	comment_text: 'comment text',
  	comment_images: null,
  	replies: null
  };
  let testReply: Reply = {
  	comment_id: testComment.id,
	  comment_user: testComment.username,
	  date: '2021-01-01',
	  username: "reply-username",
	  body: "test reply body"
  };
  let testLocationDataAll = {
  	metaInfo: {
  		locationName: testLocation.name,
		  locationLat: testLocation.latitude,
		  locationLng: testLocation.longitude,
		  description: '',
		  status: '',
		  requestTimestampLong: 0,
		  requestTimestamp: '',
		  queryDateLong: 0,
		  queryDate: '',
		  url: {
		  	type: '',
		  	url: ''
		  }
  	},
  	outputs: [
  		{
			  imageDateLong: 1234,
			  imageDate: '2021-01-01',
			  satelliteImageType: 'png',
			  satelliteImageFrequency: '',
			  cellConcentration: 0,
			  maxCellConcentration: 0,
			  latitude: testLocation.latitude,
			  longitude: testLocation.longitude,
			  validCellsCount: 0
			}
  	]
  }
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
					provide: EnvService,
					useValue: mockEnvService
				}
			]
		});
		service = TestBed.get(DownloaderService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('should test registerUser', () => {
		let httpSpy = spyOn<any>(service['http'], 'post');

		service.registerUser(testUser, testEmail, testPass);

		expect(httpSpy).toHaveBeenCalled();
	});

	it('should test userLogin', () => {
		let httpSpy = spyOn<any>(service['http'], 'post');

		service.userLogin(testUser, testPass);

		expect(httpSpy).toHaveBeenCalled();
	});

	it('should test addUserLocation', () => {
		let httpSpy = spyOn(service, 'executeAuthorizedPostRequest')
			.and.returnValue(of(null));

		service.addUserLocation(testUser, testLocation);

		expect(httpSpy).toHaveBeenCalled();
	});

	it('should test updateUserLocation', () => {
		let httpSpy = spyOn(service, 'executeAuthorizedPostRequest')
			.and.returnValue(of(null));

		service.updateUserLocation(testUser, testLocation);

		expect(httpSpy).toHaveBeenCalled();
	});

	it('should test deleteUserLocation', () => {
		let httpSpy = spyOn(service, 'executeDeleteUserLocation')
			.and.returnValue(of(null));

		service.deleteUserLocation(testUser, testId, testType);

		expect(httpSpy).toHaveBeenCalled();
	});

	it('should test executeDeleteUserLocation', () => {
		let httpSpy = spyOn(service, 'executeAuthorizedGetRequest');

		service.executeDeleteUserLocation(testUrl);

		expect(httpSpy).toHaveBeenCalled();
	});

	it('should test getUserLocation', () => {
		let httpSpy = spyOn(service, 'executeAuthorizedGetRequest');

		service.getUserLocation(testUser, testId);

		expect(httpSpy).toHaveBeenCalled();
	});

	it('should test getUserLocations', () => {
		let httpSpy = spyOn(service, 'executeAuthorizedGetRequest');

		service.getUserLocations(testUser, testType);

		expect(httpSpy).toHaveBeenCalled();
	});

	it('should test updateNotification', () => {
		let httpSpy = spyOn(service, 'executeUpdateNotification')
			.and.returnValue(of(null));

		service.updateNotification(testUser, testId);

		expect(httpSpy).toHaveBeenCalled();
	});

	it('should test executeUpdateNotification', () => {
		let httpSpy = spyOn(service, 'executeAuthorizedGetRequest');

		service.executeUpdateNotification(testUrl);

		expect(httpSpy).toHaveBeenCalled();
	});

	it('should test clearUserNotifications', () => {
		let httpSpy = spyOn(service, 'executeClearUserNotifications')
			.and.returnValue(of(null));

		service.clearUserNotifications(testUser);

		expect(httpSpy).toHaveBeenCalled();
	});

	it('should test executeClearUserNotifications', () => {
		let httpSpy = spyOn(service, 'executeAuthorizedGetRequest');

		service.executeClearUserNotifications(testUser);

		expect(httpSpy).toHaveBeenCalled();
	});

	it('should test updateUserSettings', () => {
		let httpSpy = spyOn(service, 'executeAuthorizedPostRequest');

		service.updateUserSettings(testSettings);

		expect(httpSpy).toHaveBeenCalled();
	});

	it('should test getAllComments', () => {
		let httpSpy = spyOn(service, 'executeAuthorizedGetRequest');

		service.getAllComments();

		expect(httpSpy).toHaveBeenCalled();
	});

	it('should test addUserComment', () => {
		let httpSpy = spyOn(service, 'executeAuthorizedPostRequest');

		service.addUserComment(testComment);

		expect(httpSpy).toHaveBeenCalled();
	});

	it('should test addReplyToComment', () => {
		let httpSpy = spyOn(service, 'executeAuthorizedPostRequest');

		service.addReplyToComment(testReply);

		expect(httpSpy).toHaveBeenCalled();
	});

	it('should test executeAuthorizedPostRequest - unauthenticated', () => {
		spyOn<any>(service['authService'], 'checkUserAuthentication')
			.and.returnValue(false);

		let result = service.executeAuthorizedPostRequest(testUrl, '');

		expect(result).toBeUndefined();
	});

	it('should test executeAuthorizedPostRequest - authenticated', () => {
		spyOn<any>(service['authService'], 'checkUserAuthentication')
			.and.returnValue(true);
		let httpSpy = spyOn<any>(service['http'], 'post');

		let result = service.executeAuthorizedPostRequest(testUrl, '');

		expect(httpSpy).toHaveBeenCalled();
	});

	it('should test executeAuthorizedGetRequest - unauthenticated', () => {
		spyOn<any>(service['authService'], 'checkUserAuthentication')
			.and.returnValue(false);

		let result = service.executeAuthorizedGetRequest(testUrl);

		expect(result).toBeUndefined();
	});

	it('should test executeAuthorizedGetRequest - authenticated', () => {
		spyOn<any>(service['authService'], 'checkUserAuthentication')
			.and.returnValue(true);
		let httpSpy = spyOn<any>(service['http'], 'get');

		let result = service.executeAuthorizedGetRequest(testUrl);

		expect(httpSpy).toHaveBeenCalled();
	});

	it('should test ajaxRequest', () => {
		let loaderSpy = spyOn<any>(service['loaderService'], 'show');

		service.ajaxRequest(testLocation, testUser, testUrl);

		expect(loaderSpy).toHaveBeenCalled();
	});

	it('should test getAjaxData', () => {
		spyOn<any>(service['authService'], 'checkUserAuthentication')
			.and.returnValue(true);
		let ajaxSpy = spyOn<any>(service, 'ajaxRequest');

		service.getAjaxData(testUser, testLocation);

		expect(ajaxSpy).toHaveBeenCalled();
	});

	it('should test getLocationIndex', () => {
		service.locations = [testLocation];
		const testIndex = 0;

		let result = service.getLocationIndex(testLocation);

		expect(result).toEqual(testIndex);
	});

	it('should test locationNotDeleted', () => {
		service.locations = [testLocation];
		const testIndex = 0;
		let locSpy = spyOn(service, 'getLocationIndex');

		service.locationNotDeleted(testLocation);

		expect(locSpy).toHaveBeenCalled();
	});

	it('should test getData', () => {
		service.locations = [testLocation];

		service.getData().subscribe(locations => {
			expect(locations[0].id).toEqual(testLocation.id);
		});
	});

	it('should test getTimeSeries', () => {
		service.locationsData = [testLocation];

		service.getTimeSeries().subscribe(locationsData => {
			expect(locationsData[0]['id']).toEqual(testLocation.id);
		});
	});

	it('should test createLocation', () => {
		spyOn(service, 'convertCoordinates')
			.and.returnValue(testCoordinates);
		spyOn(service, 'locationNotDeleted')
			.and.returnValue(true);
		spyOn(service, 'addUniqueId')
			.and.returnValue(testLocation.name);
		spyOn(service, 'updateUserLocation');

		let result = service.createLocation(testLocation, testUser, testLocationDataAll);

		expect(result.id).toEqual(testLocation.id);
	});

	it('should test convertCoordinates', () => {
		let result = service.convertCoordinates(testLocation.latitude, testLocation.longitude);

		expect(result.latDeg).toEqual(Math.trunc(testLocation.latitude))
	});

	it('should test addUniqueId', () => {
		const expectedResult = testLocation.name + ' -- 1'; 

		let result = service.addUniqueId(testLocation);

		expect(result).toMatch(expectedResult);
	});

	// it('should test updateProgressBar', () => {
	// 	let loadSpy = spyOn<any>(service['loaderService'], 'hide');
	// 	spyOn<any>(service['loaderService'], 'progressValue')
	// 		.and.returnValue(new Subject<any>());

	// 	service.updateProgressBar();

	// 	expect(loadSpy).toHaveBeenCalled();
	// });

});
