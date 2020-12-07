import { TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';

import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { MapService } from './map.service';

describe('MapService', () => {

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
	});

	it('should be created', () => {
		const service: MapService = TestBed.get(MapService);
		expect(service).toBeTruthy();
	});

});
