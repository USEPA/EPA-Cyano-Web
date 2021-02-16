import { TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';

import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { EnvService } from './env.service';

describe('EnvService', () => {

	let service: EnvService;

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
		service = TestBed.get(EnvService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('should test setConfig - allowedRetries exceeded', () => {
		service.retries = service.allowedRetries + 1;

		let result = service.setConfig('');

		expect(result).toBeUndefined();
	});

});
