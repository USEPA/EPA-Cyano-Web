import { TestBed } from '@angular/core/testing';

import { LoaderService } from './loader.service';

describe('LoaderService', () => {

	let service: LoaderService;

  beforeEach(() => {
  	TestBed.configureTestingModule({
  		providers: [LoaderService]
  	})
  	service = TestBed.get(LoaderService);
  });

  it('should be created', () => {
    
    expect(service).toBeTruthy();
  });

  it('should test show()', () => {
  	let loadSpy = spyOn(service.isLoading, 'next');

  	service.show();

  	expect(loadSpy).toHaveBeenCalled();
  });

  it('should test hide()', () => {
  	let loadSpy = spyOn(service.isLoading, 'next');
  	let userSpy = spyOn(service.isUserLocations, 'next');

  	service.hide();

  	expect(loadSpy).toHaveBeenCalled();
  	expect(userSpy).toHaveBeenCalled();
  });

  it('should test showProgressBar()', () => {
  	let userSpy = spyOn(service.isUserLocations, 'next');

  	service.showProgressBar();

  	expect(userSpy).toHaveBeenCalled();
  });

  it('should test updateProgressValue()', () => {
  	const testVal: number = 0;
  	let progSpy = spyOn(service.progressValue, 'next');

  	service.updateProgressValue(testVal);

  	expect(progSpy).toHaveBeenCalled();
  });

});
