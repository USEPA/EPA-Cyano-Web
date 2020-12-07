import { TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';

import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { DownloaderService } from './downloader.service';

describe('DownloaderService', () => {

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
		const service: DownloaderService = TestBed.get(DownloaderService);
		expect(service).toBeTruthy();
	});

});
