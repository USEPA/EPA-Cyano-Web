import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from "@angular/router/testing";
import { HttpClientModule } from '@angular/common/http';
import { of } from 'rxjs';

import { MockLocation } from '../../testing/mocks/location';
import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { MyLocationsComponent } from './my-locations.component';

describe('MyLocationsComponent', () => {

  let component: MyLocationsComponent;
  let fixture: ComponentFixture<MyLocationsComponent>;
  let testLocation: MockLocation = new MockLocation();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientModule
      ],
      declarations: [ MyLocationsComponent ],
      providers: [
        AuthService,
        LoaderService,
        CyanMap
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyLocationsComponent);
    component = fixture.componentInstance;
    component.locations = [new MockLocation()];
    component.sorted_locations = [new MockLocation()];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should test ngOnInit - unauthenticated', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(false);

    let result = component.ngOnInit();

    expect(result).toBeUndefined();
  });

  it('should test ngOnInit - authenticated', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);
    spyOn(component, 'getLocations');
    spyOn(component, 'sortLocations');

    let result = component.ngOnInit();

    expect(result).toBeUndefined();
  });

  it('should test getSource', () => {
    let mapSpy = spyOn<any>(component['mapService'], 'getSource');

    component.getSource();

    expect(mapSpy).toHaveBeenCalled();
  });

  it('should test getLocations', () => {
    component.locations = [];
    spyOn<any>(component['locationService'], 'getLocations')
      .and.returnValue(of([testLocation]));

    component.getLocations();

    console.log(component.locations);
    expect(component.locations.length).toEqual(1);
  });

  it('should test sortLocations - show_checked false', () => {
    component.show_checked = false;
    component.sorted_locations = [];

    component.sortLocations();

    console.log(component.sorted_locations);
    expect(component.sorted_locations.length).toEqual(1);
  });

  it('should test sortLocations - show_checked true', () => {
    component.show_checked = true;
    component.sorted_locations = [];

    component.sortLocations();

    expect(component.sorted_locations.length).toEqual(0);
  });

  it('should test toggleChecked', () => {
    component.show_checked = false;
    spyOn(component, 'filterLocations');

    component.toggleChecked();

    expect(component.show_checked).toBe(true);
  });

  it('should test filterLocations', () => {
    component.show_checked = true;
    component.sorted_locations = [];

    component.filterLocations();

    console.log(component.sorted_locations)
    expect(component.sorted_locations.length).toEqual(0);
  });

  it('should test filterLocations', () => {
    component.show_checked = false;
    component.sorted_locations = [];

    component.filterLocations();

    expect(component.sorted_locations.length).toEqual(1);
  });

  it('should test hasLocations() - does not have locations', () => {
    component.locations = [];

    let result = component.hasLocations();

    expect(result).toBe(false);
  });

  it('should test hasLocations() - has locations', () => {

    let result = component.hasLocations();

    expect(result).toBe(true);
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

  it('should test exceedAlertValue', () => {
    let locSpy = spyOn<any>(component['locationService'], 'exceedAlertValue');

    component.exceedAlertValue(testLocation);

    expect(locSpy).toHaveBeenCalled();
  });

  it('should test formatNumber()', () => {
    const testNumber = 0.75;
    let locSpy = spyOn<any>(component['locationService'], 'formatNumber')
      .and.returnValue(testNumber);

    component.formatNumber(testNumber);

    expect(locSpy).toHaveBeenCalled();
  });

  it('should test locationSelect()', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(false);

    let result = component.locationSelect(null, testLocation);

    expect(result).toBeUndefined();
  });

  it('should test locationSelect()', () => {
    const testEvent = null;
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);
    let routerSpy = spyOn<any>(component['router'], 'navigate');

    component.locationSelect(testEvent, testLocation);

    expect(routerSpy).toHaveBeenCalledWith(['/locationdetails', {
      location: testLocation.id, 
      locations: [testLocation.id]
    }]);
  });

});
