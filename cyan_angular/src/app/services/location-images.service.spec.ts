import { TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';

import { MockLocation } from '../../testing/mocks/location';
import { EnvService } from './env.service';
import { LocationImagesService } from './location-images.service';

describe('LocationImagesService', () => {

	let service: LocationImagesService;
	let mockEnvService = {
		config: {
			baseServerUrl: 'http://testurl/'
		}
	};
	let testLocation: MockLocation = new MockLocation();
	const testUrl = 'http://testurl/';

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [
				HttpClientModule
			],
			providers: [
				{
					provide: EnvService,
					useValue: mockEnvService
				}
			]
		});
		service = TestBed.get(LocationImagesService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('should test getImageDetails()', () => {
		spyOn(service, 'addImagesParameter')
			.and.returnValue(null);
		let httpSpy = spyOn<any>(service['http'], 'get');

		service.getImageDetails(testLocation.latitude, testLocation.longitude, testLocation.type);

		expect(httpSpy).toHaveBeenCalled();
	});

	it('should test getAllImages()', () => {
		spyOn(service, 'addImagesParameter')
			.and.returnValue(null);
		let httpSpy = spyOn<any>(service['http'], 'get');

		service.getAllImages(testLocation.latitude, testLocation.longitude, testLocation.type);

		expect(httpSpy).toHaveBeenCalled();
	});

	it('should test addImagesParameter()', () => {
		const expectedResult = testUrl + '?type=olci&frequency=weekly';

		let result = service.addImagesParameter(testUrl, testLocation.type);

		expect(result).toContain(expectedResult)
	});

});
