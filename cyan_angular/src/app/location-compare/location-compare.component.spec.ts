import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from "@angular/router/testing";
import { MatDialogModule } from '@angular/material/dialog';
import { of } from 'rxjs';

import { UserSettings } from '../models/settings';
import { MockLocation } from '../../testing/mocks/location';
import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { LocationCompareComponent } from './location-compare.component';

describe('LocationCompareComponent', () => {

  let component: LocationCompareComponent;
  let fixture: ComponentFixture<LocationCompareComponent>;
  let testLocation: MockLocation = new MockLocation();

  let testSettings: UserSettings = {
    level_low: 0,
    level_medium: 5,
    level_high: 10,
    enable_alert: false,
    alert_value: 5
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        RouterTestingModule,
        MatDialogModule
      ],
      declarations: [ LocationCompareComponent ],
      providers: [
        AuthService,
        LoaderService,
        CyanMap
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LocationCompareComponent);
    component = fixture.componentInstance;
    component.selected_locations = [new MockLocation()];

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should test getLocations()', () => {
    spyOn<any>(component['locationService'], 'getCompareLocations')
      .and.returnValue(of([testLocation]));
    spyOn<any>(component['locationService'], 'getLocations')
      .and.returnValue(of([testLocation]));

    component.getLocations();

    expect(component.selected_locations[0].name).toMatch(testLocation.name);
  });

  it('should test removeLocation() - unauthenticated', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(false);

    let result = component.removeLocation(testLocation);

    expect(result).toBeUndefined();
  });

  it('should test removeLocation() - successful', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);
    let locSpy = spyOn<any>(component['locationService'], 'deleteCompareLocation');

    component.removeLocation(testLocation);

    expect(locSpy).toHaveBeenCalled();
  });

  it('should test hasLocations - locations exist', () => {
    let result = component.hasLocations();

    expect(result).toBe(true);
  });

  it('should test hasLocations - locations do not exist', () => {
    component.selected_locations = [];

    let result = component.hasLocations();

    expect(result).toBe(false);
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
      console.log("Testing '" + testColor + "' color for cell concentrations");

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

  it('should test compareLocations - unauthenticated', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(false);

    let result = component.compareLocations();

    expect(result).toBeUndefined();
  });

  it('should test compareLocations - less than 2 locations selected', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);
    let dialogSpy = spyOn<any>(component['dialog'], 'open');

    let result = component.compareLocations();

    expect(dialogSpy).toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it('should test compareLocations - navigates to location compare details', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);
    let routerSpy = spyOn<any>(component['router'], 'navigate');
    component.selected_locations.push(testLocation);
    component.selected_locations[1].id = 2;

    component.compareLocations();

    expect(routerSpy).toHaveBeenCalledWith(['/locationcomparedetails', {
      locations: component.selected_locations.map((ln: MockLocation) => ln.id),
      current_location: component.selected_locations[0].id
    }]);
  });

});
