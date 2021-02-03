import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { RouterTestingModule } from "@angular/router/testing";
import { of } from 'rxjs';

import { Location } from '../models/location';
import { MockLocation } from '../../testing/mocks/location';
import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { MapPopupComponent } from './map-popup.component';

describe('MapPopupComponent', () => {

  let component: MapPopupComponent;
  let fixture: ComponentFixture<MapPopupComponent>;
  let testLocation: Location = new MockLocation();
  let testEvent = {
    target: {
      value: null
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        RouterTestingModule
      ],
      declarations: [ MapPopupComponent ],
      providers: [
        AuthService,
        LoaderService,
        CyanMap,
        DatePipe
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapPopupComponent);
    component = fixture.componentInstance;
    component.locationData = testLocation;

    // component.location = new MockLocation();
    component.location = testLocation;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should test ngOnInit()', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(false);

    let result = component.ngOnInit();

    expect(result).toBeUndefined();
  });

  it('should test ngOnInit() - authenticated, has location', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);
    spyOn<any>(component['locationService'], 'getStaticLocations')
      .and.returnValue([testLocation]);
    spyOn(component, 'getLocation');
    spyOn<any>(component['locationService'], 'downloadLocation');
    spyOn(component, 'locationInCompareArray')
      .and.returnValue(false);
    
    component.ngOnInit();

    expect(component.location.name).toMatch(testLocation.name);
  });

  it('should test ngOnDestroy', () => {

    component.ngOnDestroy();

    expect(component.locationData).toBe(null);
    expect(component.location).toBe(null);
  });

  it('should test locationInCompareArray, initial location not set', () => {
    component.location = null;

    let result = component.locationInCompareArray([testLocation]);

    expect(result).toBeUndefined();
  });

  it('should test locationInCompareArray, not in compare array', () => {
    let newTestLocation = new MockLocation();
    newTestLocation.id = 999;

    let result = component.locationInCompareArray([newTestLocation]);

    expect(result).toBe(false);
  });

  it('should test locationInCompareArray, in compare array', () => {

    let result = component.locationInCompareArray([testLocation]);

    expect(result).toBe(true);
  });

  it('should test getLocation', () => {
    spyOn<any>(component['locationService'], 'getLocationData')
      .and.returnValue(of([testLocation]));

    component.getLocation();

    expect(component.location.name).toMatch(testLocation.name);
  });

  it('should test getPercentage', () => {
    const testPercentage: number = 0;
    let locSpy = spyOn<any>(component['locationService'], 'getPercentage')
      .and.returnValue(testPercentage);

    component.getPercentage();

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
      console.log("Testing '" + testColor + "' color for cell concentrations");

      locSpy.and.returnValue(testColor);

      let result = component.getColor(testDelta);

      expect(result).toContain(testResults[i]);

      i = i + 1;
    });
  });

  it('should test getArrow()', () => {
    let locSpy = spyOn<any>(component['locationService'], 'getArrow')
      .and.returnValue(false);

    component.getArrow();

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

  it('should test updateName - unauthenticated', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(false);

    let result = component.updateName(testEvent);

    expect(result).toBeUndefined();
  });

  it('should test updateName - authenticated', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);
    let locSpy = spyOn<any>(component['locationService'], 'updateLocation');

    component.updateName(testEvent);

    expect(locSpy).toHaveBeenCalled();
  });

  it('should test saveNoteToLocation - unauthenticated', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(false);

    let result = component.saveNoteToLocation(testLocation);

    expect(result).toBeUndefined();
  });

  it('should test saveNoteToLocation - note gets saved', () => {
    const noteInputElement = document.createElement('input');
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);
    let locSpy = spyOn<any>(component['locationService'], 'getLocations')
      .and.returnValue(of([testLocation]));
    spyOn<any>(component['locationService'], 'updateLocation');

    component.saveNoteToLocation(testLocation);

    expect(locSpy).toHaveBeenCalled();
  });

  it('should test toggleMarkedLocation - unauthenticated', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(false);

    let result = component.toggleMarkedLocation(testLocation);

    expect(result).toBeUndefined();
  });

  it('should test toggleMarkedLocation', () => {
    let expectedVal = 'Mark';
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);
    spyOn<any>(component['mapService'], 'updateMarker');
    let locSpy = spyOn<any>(component['locationService'], 'updateLocation');

    component.toggleMarkedLocation(testLocation);

    expect(component.marked).toMatch(expectedVal);
    expect(locSpy).toHaveBeenCalled();
  });

  it('should test compareLocation - unauthenticated', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(false);

    let result = component.compareLocation(testLocation);

    expect(result).toBeUndefined();
  });

  it('should test compareLocation - addCompareLocation called', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);
    let locSpy = spyOn<any>(component['locationService'], 'addCompareLocation');

    component.compareLocation(testLocation);

    expect(locSpy).toHaveBeenCalled();
  });

  it('should test compareLocation - deleteCompareLocation called', () => {
    component.compareSelected = true;
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);
    let locSpy = spyOn<any>(component['locationService'], 'deleteCompareLocation');

    component.compareLocation(testLocation);

    expect(locSpy).toHaveBeenCalled();
  });

  it('should test viewLatestImage - unauthenticated', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(false);

    let result = component.viewLatestImage(testLocation);

    expect(result).toBeUndefined();
  });

  it('should test viewLatestImage - navigates to /latestimage', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);
    let routerSpy = spyOn<any>(component['router'], 'navigate');

    component.viewLatestImage(testLocation);
    
    expect(routerSpy).toHaveBeenCalledWith(['/latestimage', {location: JSON.stringify(testLocation)}]);
  });

  it('should test deleteLocation - unauthenticated', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(false);

    let result = component.deleteLocation(testLocation);

    expect(result).toBeUndefined();
  });

  it('should test deleteLocation - location deleted', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);
    let mapSpy = spyOn<any>(component['mapService'], 'deleteMarker');
    let locSpy = spyOn<any>(component['locationService'], 'deleteLocation');

    component.deleteLocation(testLocation);

    expect(mapSpy).toHaveBeenCalled();
    expect(locSpy).toHaveBeenCalled();
  });

});
