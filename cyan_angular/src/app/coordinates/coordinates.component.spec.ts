import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LatLng, Map } from 'leaflet';

import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { DialogComponent } from '../shared/dialog/dialog.component';
import { CoordinatesComponent } from './coordinates.component';
import { MockLocation } from '../../testing/mocks/location';

describe('CoordinatesComponent', () => {
  let component: CoordinatesComponent;
  let fixture: ComponentFixture<CoordinatesComponent>;
  let authSpy;

  const mockDialogComponent = {

  };

  const testLocation = new MockLocation();

  const mockMap = {
    setview: null
  };

  // const testLatLng = new LatLng();
  // testLatLng.

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        MatDialogModule
      ],
      declarations: [ CoordinatesComponent ],
      providers: [
        AuthService,
        LoaderService,
        CyanMap,
        {
          provide: DialogComponent,
          useValue: mockDialogComponent
        }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CoordinatesComponent);
    component = fixture.componentInstance;

    authSpy = spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should test markLocation() - not authenticated', () => {
    authSpy.and.returnValue(false);

    let result = component.markLocation();

    expect(result).toBeUndefined();
  });

  it('should test markLocation() - not valid coords', () => {
    spyOn(component, 'validateCoords')
      .and.returnValue(false);

    let result = component.markLocation();

    expect(result).toBeUndefined();
  });

  it('should test markLocation() - valid coords', () => {
    spyOn(component, 'validateCoords')
      .and.returnValue(true);
    spyOn(component, 'getLocationData')
      .and.returnValue(testLocation);
    spyOn<any>(component['locationService'], 'setMarked');
    spyOn<any>(component['mapService'], 'updateMarker');
    spyOn<any>(component['locationService'], 'updateLocation');

    component.markLocation();

    expect(component.location.name).toMatch(testLocation.name);
  });

  it('should test compareLocation() - not authenticated', () => {
    authSpy.and.returnValue(false);

    let result = component.compareLocation();

    expect(result).toBeUndefined();
  });

  it('should test compareLocation() - not valid coords', () => {
    spyOn(component, 'validateCoords')
      .and.returnValue(false);

    let result = component.compareLocation();

    expect(result).toBeUndefined();
  });

  it('should test compareLocation() - not valid coords', () => {
    spyOn(component, 'validateCoords')
      .and.returnValue(true);
    spyOn(component, 'getLocationData')
      .and.returnValue(testLocation);
    spyOn<any>(component['locationService'], 'addCompareLocation');

    component.compareLocation();

    expect(component.location.name).toMatch(testLocation.name);
  });

  it('should test getLocationData()', () => {
    spyOn<any>(component['mapService'], 'getMap')
      .and.returnValue(new MockMap());
    spyOn<any>(component['locationService'], 'createLocation')
      .and.returnValue(testLocation);
    spyOn<any>(component['mapService'], 'getLatLng')
      .and.returnValue(new LatLng(component.conusTop, component.conusLeft));
    spyOn<any>(component['mapService'], 'addMarker')
      .and.returnValue(new MockMarker());

    let result = component.getLocationData();

    expect(result.name).toMatch(testLocation.name);
  });

  it('should test onSelect()', () => {
    // const selectOptions: string[] = ['dms', 'dd'];
    const testOption = {value: 'dms'};

    component.onSelect(testOption);

    expect(component.selectedKey).toMatch(testOption.value);
  });

  it('should test validateCoords() - not within conus', () => {
    const testLatLon = [33, -81];
    spyOn<any>(component['mapService'], 'convertDmsToDd')
      .and.returnValue(testLatLon);
    spyOn(component, 'withinConus')
      .and.returnValue(false);
    spyOn(component, 'displayError');

    let result = component.validateCoords();

    expect(result).toBe(false);
  });

  it('should test validateCoords() - valid coords', () => {
    const testLatLon = [33, -81];
    spyOn<any>(component['mapService'], 'convertDmsToDd')
      .and.returnValue(testLatLon);
    spyOn(component, 'withinConus')
      .and.returnValue(true);

    let result = component.validateCoords();

    expect(result).toBe(true);
  });

  it('should test withinConus() - latitude out of bounds', () => {
    const testLat: number = component.conusBottom - 1;  // invalid lat
    const testLon: number = -81;  // valid lon

    let result = component.withinConus(testLat, testLon);

    expect(result).toBe(false);
  });

  it('should test withinConus() - longitude out of bounds', () => {
    const testLat: number = component.conusBottom + 1;  // valid lat
    const testLon: number = component.conusLeft - 1;  // invalid lon

    let result = component.withinConus(testLat, testLon);

    expect(result).toBe(false);
  });

  it('should test withinConus() - dms coords in bounds', () => {
    const testLat: number = 34  // valid lat
    const testLon: number = 81  // valid lon
    component.selectedKey = 'dms';

    let result = component.withinConus(testLat, testLon);

    expect(result).toBe(true);
  });

  it('should test withinConus() - dd coords in bounds', () => {
    const testLat: number = 34  // valid lat
    const testLon: number = -81  // valid lon
    component.selectedKey = 'dd';

    let result = component.withinConus(testLat, testLon);

    expect(result).toBe(true);
  });

});

export class MockMap {
  public setView(latLon, zoom) {
    return;
  }
};

export class MockMarker {
  public fireEvent(event) {
    return;
  }
};