import { TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';

import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { EnvService } from './env.service';

describe('EnvService', () => {

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
		const service: EnvService = TestBed.get(EnvService);
		expect(service).toBeTruthy();
	});

});
