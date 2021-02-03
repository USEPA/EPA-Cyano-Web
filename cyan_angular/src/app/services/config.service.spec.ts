import { TestBed } from '@angular/core/testing';

import { ConcentrationRanges } from '../test-data/test-levels';
import { ConfigService } from './config.service';

describe('ConfigService', () => {

	let service: ConfigService;
	let concentrationRanges: ConcentrationRanges = new ConcentrationRanges();

  beforeEach(() => {
  	TestBed.configureTestingModule({});
  	service = TestBed.get(ConfigService);
  });

  it('should be created', () => {
    const service: ConfigService = TestBed.get(ConfigService);
    expect(service).toBeTruthy();
  });

  it('should test resetLevels()', () => {
  	service.resetLevels();

  	expect(service.modified_cyan_levels.low[0]).toEqual(concentrationRanges.low[0]);
  });

  it('should test getLevels()', () => {
  	service.modified_cyan_levels = concentrationRanges;

  	service.getLevels().subscribe(cyan_levels => {
  		expect(service.modified_cyan_levels.low[0]).toEqual(concentrationRanges.low[0]);
  	});
  });

	it('should test getStaticLevels()', () => {
		service.modified_cyan_levels = concentrationRanges;

		service.getStaticLevels();

		expect(service.modified_cyan_levels.low[0]).toEqual(concentrationRanges.low[0]);
  });

	it('should test changeLevels()', () => {
		const low = [1, 10];
		const med = [11, 100];
		const hi = [101, 1000];
		const vhi = [1001];

		service.changeLevels(low, med, hi, vhi);

		expect(service.modified_cyan_levels.low[0]).toEqual(low[0]);
	});

	it('should test getColorRgbValue()', () => {
		let expectedResult = 'rgb(0, 128, 0)';

		let result = service.getColorRgbValue('green');

		expect(result).toContain(expectedResult);
	});

});
