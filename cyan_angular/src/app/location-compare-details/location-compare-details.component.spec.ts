import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from "@angular/router/testing";
import { HttpClientModule } from '@angular/common/http';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { of, Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Map, LatLng } from 'leaflet';
import * as L from 'leaflet';

import { MockLocation } from '../../testing/mocks/location';
import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { Degree } from '../services/location.service';
import { LocationCompareDetailsComponent } from './location-compare-details.component';

let rawDataResponse = require('../../testing/mocks/raw-data-response.json');


describe('LocationCompareDetailsComponent', () => {

  let component: LocationCompareDetailsComponent;
  let fixture: ComponentFixture<LocationCompareDetailsComponent>;
  let testLocation: MockLocation = new MockLocation();
  let testCyanMap: CyanMap = new CyanMap();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientModule,
        MatBottomSheetModule
      ],
      declarations: [ LocationCompareDetailsComponent ],
      providers: [
        AuthService,
        LoaderService,
        CyanMap,
        {
          provide: ActivatedRoute,
          useValue: {
            params: of(
            {
              location: testLocation.id,
              locations: testLocation.id + ','
            })
          }
        }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    LocationCompareDetailsComponent.prototype.ngOnInit = () => {};  // skips ngOnInit
    fixture = TestBed.createComponent(LocationCompareDetailsComponent);
    component = fixture.componentInstance;
    component.locations = [testLocation];
    component.current_location = testLocation;
    component.dataDownloaded = false;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should test ngOnInit() - unauthenticated', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(false);

    let result = component.ngOnInit();

    expect(result).toBeUndefined();
  });

  // it('should test ngOnInit() - authenticated, downloadTimeSeries gets called', () => {
  //   spyOn<any>(component['authService'], 'checkUserAuthentication')
  //     .and.returnValue(true);
  //   spyOn<any>(component['locationService'], 'getLocationByID');
  //   spyOn<any>(component['locationService'], 'getStaticLocations');
  //   let downloadSpy = spyOn(component, 'downloadTimeSeries');
  //   // spyOn<any>(component['tsSub'], 'unsubscribe');
  //   spyOn<any>(component, 'tsSub')
  //     .and.returnValue(new MockSpy());
  //   component.dataDownloaded = true;

  //   component.ngOnInit();

  //   expect(component.tsTicker).toEqual(1);
  //   expect(downloadSpy).toHaveBeenCalled();
  // });

  it('should test downloadTimeSeries()', () => {
    spyOn<any>(component['locationService'], 'convertToDegrees');
    spyOn<any>(component['locationService'], 'downloadLocation');
    spyOn<any>(component['downloader'], 'getTimeSeries')
      .and.returnValue(of(rawDataResponse));

    component.downloadTimeSeries(testLocation);

    expect(rawDataResponse[testLocation.id].requestData.outputs.length)
      .toEqual(component.chartData[0].data.length);
    expect(testLocation.name).toMatch(component.chartData[0].label);
    expect(component.dataDownloaded).toBe(true);
  });

  it('should test displayMap', () => {
    const testEvent = new MockEvent();
    testEvent.index = 2;

    component.displayMap(testEvent);

    expect(component.showMap).toBe(true);
  });

  it('should test onMapReady() - unauthenticated', () => {
    const testMap = testCyanMap.map;
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(false);

    let result = component.onMapReady(testMap);

    expect(result).toBeUndefined();
  });

  it('should test onMapReady() - map gets called', () => {
    let mapDomObj = document.createElement('div');
    mapDomObj.classList.add('map');
    const testMap = L.map(mapDomObj, {center: [34, -81], zoom: 12});
    let latLon = new LatLng(testLocation.latitude, testLocation.longitude);
    let latLonArray = [];
    latLonArray.push(latLon)
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);
    let mapSpy = spyOn(testMap, 'invalidateSize');
    spyOn(testMap, 'flyToBounds');

    component.onMapReady(testMap);

    expect(mapSpy).toHaveBeenCalled();
  });

  it('should test getPercentage', () => {
    const testPercentage: number = 0;
    let locSpy = spyOn<any>(component['locationService'], 'getPercentage')
      .and.returnValue(testPercentage);

    component.getPercentage(testLocation);

    expect(locSpy).toHaveBeenCalled();
  });

  it('should test getPercentage2', () => {
    const testPercentage: number = 0;
    let locSpy = spyOn<any>(component['locationService'], 'getPercentage2')
      .and.returnValue(testPercentage);

    component.getPercentage2(testLocation);

    expect(locSpy).toHaveBeenCalled();
  });

  it('should test getColor', () => {
    const testColors = ['green', 'yellow', 'orange', 'red'];
    const testResults = ['rgb(0, 128, 0)', 'rgb(200, 200, 0)', 'rgb(255, 165, 0)', 'rgb(255, 0, 0)'];
    let testColor;
    const testDelta = false;
    let locSpy = spyOn<any>(component['locationService'], 'getColor');
    let i = 0;

    testColors.forEach(testColor => {
      locSpy.and.returnValue(testColor);

      let result = component.getColor(testLocation, testDelta);

      expect(result).toContain(testResults[i]);

      i = i + 1;
    });
  });

  it('should test getArrow()', () => {
    let locSpy = spyOn<any>(component['locationService'], 'getArrow')
      .and.returnValue(false);

    component.getArrow(testLocation);

    expect(locSpy).toHaveBeenCalled();
  });

  it('should test getArrowColor()', () => {
    const testColor = 'green';
    const testDelta = false;
    let locSpy = spyOn<any>(component['locationService'], 'getColor')
      .and.returnValue(testColor);

    component.getArrowColor(testLocation, testDelta);

    expect(locSpy).toHaveBeenCalled();
  });

  it('should test formatNumber()', () => {
    const testNumber = 0.75;
    let locSpy = spyOn<any>(component['locationService'], 'formatNumber')
      .and.returnValue(testNumber);

    component.formatNumber(testNumber);

    expect(locSpy).toHaveBeenCalled();
  });

});

class MockEvent {
  index: number;
};

class MockSpy {
  unsubscribe() {
    return null;
  }
}