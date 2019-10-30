import { TestBed } from '@angular/core/testing';

import { LocationImagesService } from './location-images.service';

describe('LocationImagesService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: LocationImagesService = TestBed.get(LocationImagesService);
    expect(service).toBeTruthy();
  });
});
