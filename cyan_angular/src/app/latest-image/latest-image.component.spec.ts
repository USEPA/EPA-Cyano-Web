import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from "@angular/router/testing";
import { HttpClientModule } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ImageOverlay, latLngBounds, latLng, Marker, marker } from 'leaflet';

import { MockLocation } from '../../testing/mocks/location';
import { ActivatedRouteStub } from '../../testing/activated-route-stub';
import { Location } from '../models/location';
import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { LatestImageComponent } from './latest-image.component';
import { Degree } from '../services/location.service';

let latestImageJson = require('../../testing/mocks/all-images-response.json');

describe('LatestImageComponent', () => {

  let component: LatestImageComponent;
  let fixture: ComponentFixture<LatestImageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientModule
      ],
      declarations: [
        LatestImageComponent
      ],
      providers: [
        AuthService,
        LoaderService,
        CyanMap
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LatestImageComponent);
    component = fixture.componentInstance;
    component.location = new MockLocation();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should test exit()', () => {
    let routerSpy = spyOn<any>(component['router'], 'navigate');

    component.exit();

    expect(routerSpy).toHaveBeenCalledWith(['/']);
  });

  // NOTE: Does not test the recursive loop with timeout.
  it('should test getImages() - imageCollection gets set by getAllImages spy', () => {
    let testDeg: Degree = new Degree();
    testDeg.latitude = 35;
    testDeg.longitude = -82;
    spyOn<any>(component['locationService'], 'convertToDegrees')
      .and.returnValue(testDeg);
    spyOn<any>(component['images'], 'getAllImages')
      .and.returnValue(of(latestImageJson));
    spyOn(component, 'setImages');
    spyOn(component, 'toggleImage');

    component.getImages();

    expect(component.imageCollection[0].name).toMatch(latestImageJson[0].name);
  });
  
  it('should test setImages() - get defined or undefined', () => {
    component.imageCollection = latestImageJson;

    component.setImages();

    expect(component.locationPNGs[0].name).toMatch(latestImageJson[0].name);
    expect(component.locationTIFFs.length).toEqual(0);
    expect(component.locationThumbs.length).toEqual(0);
    expect(component.filteredPNGs[0].name).toMatch(latestImageJson[0].name);
  });

  it('should test clearImages() - params set to null', () => {
    component.clearImages();

    expect(component.locationPNGs).toEqual(null);
    expect(component.locationTIFFs).toEqual(null);
    expect(component.locationThumbs).toEqual(null);
    expect(component.imageCollection).toEqual(null);
  });

  it('should test toggleImage() - not authenticated', () => {
    const testImage = latestImageJson[0];
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(false);

    let result = component.toggleImage(testImage);

    expect(result).toBeUndefined();
  });

  // TODO: Finish unit tests for toggleImage().
  it('should test toggleImage() - ', () => {
    const testImage = latestImageJson[0];
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(false);

    let result = component.toggleImage(testImage);

    expect(result).toBeUndefined();
  });

  it('should test getImageTitle()', () => {
    const expectedResult = "L 1/16/2021"

    let result = component.getImageTitle(latestImageJson[0]);

    expect(result).toMatch(expectedResult);
  });

  it('should test getImageDate2', () => {
    const expectedResult = "1/16/2021"

    let result = component.getImageDate2(latestImageJson[0]);

    expect(result).toMatch(expectedResult);
  });

  it('should test changeOpacity()', () => {
    const testEvent: any = {
      value: 0.5
    };
    const testBound1 = latLng(34, -81);
    const testBound2 = latLng(35, -82);
    const testLayer: ImageOverlay = new ImageOverlay("", latLngBounds(testBound1, testBound2));
    component.layer = testLayer;

    component.changeOpacity(testEvent);

    expect(component.layer.options.opacity).toEqual(testEvent.value);
  });

  it('should test onMapReady()', () => {
    // TODO
  });

  it('should test createMarker()', () => {
    const testLatLng = latLng(34, -81);
    const testMarkerUrl = 'test/image.png';
    spyOn<any>(component['mapService'], 'getLatLng')
      .and.returnValue(testLatLng);
    spyOn<any>(component['mapService'], 'getMarker')
      .and.returnValue(testMarkerUrl);

    let result = component.createMarker();

    expect(result.options.title).toMatch(component.location.name);
  });

});
