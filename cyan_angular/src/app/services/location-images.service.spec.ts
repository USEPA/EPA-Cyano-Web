import { TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';

import { LocationImagesService } from './location-images.service';

describe('LocationImagesService', () => {

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [
				HttpClientModule
			]
		});
	});

	it('should be created', () => {
		const service: LocationImagesService = TestBed.get(LocationImagesService);
		expect(service).toBeTruthy();
	});

});
