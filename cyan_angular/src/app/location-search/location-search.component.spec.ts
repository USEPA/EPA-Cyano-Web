import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { of } from 'rxjs';
import * as L from 'leaflet';

import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { LocationSearchComponent } from './location-search.component';
import { MockLocation } from '../../testing/mocks/location';
import { Location } from '../models/location';

let locationSearchResults = require('../../testing/mocks/location-search-results.json');


describe('LocationSearchComponent', () => {

  let component: LocationSearchComponent;
  let fixture: ComponentFixture<LocationSearchComponent>;
  let testLocation: Location = new MockLocation();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule
      ],
      declarations: [ LocationSearchComponent ],
      providers: [
        AuthService,
        LoaderService,
        CyanMap
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LocationSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should test searchLocation', () => {
    let downladerSpy = spyOn<any>(component['downloader'], 'executeAuthorizedGetRequest')
      .and.returnValue(of(locationSearchResults));
    spyOn(component, 'createLocationResults')
      .and.returnValue(locationSearchResults);

    component.searchLocation();

    expect(downladerSpy).toHaveBeenCalled();
  });

  it('should test createLocationResults', () => {
    spyOn(component, 'inUnitedStates')
      .and.returnValue(true);

    let result = component.createLocationResults(locationSearchResults);

    console.log(result[0]);
    expect(result[0].place_id).toEqual(locationSearchResults[0].place_id);
  });

  it('should test viewLocation', () => {
    let mapDomObj = document.createElement('div');
    mapDomObj.classList.add('map');
    const testMap = L.map(mapDomObj, {center: [34, -81], zoom: 12});
    testLocation['lat'] = testLocation.latitude;
    testLocation['lon'] = testLocation.longitude;
    let mapSpy = spyOn<any>(component['mapService'], 'getMap')
      .and.returnValue(testMap);

    component.viewLocation(testLocation);

    expect(mapSpy).toHaveBeenCalled();
  });

  it('should test inUnitedStates - within US', () => {
    const testLocationResult = locationSearchResults[0];

    let result = component.inUnitedStates(testLocationResult);

    expect(result).toBe(true);
  });

  it('should test inUnitedStates - outside US', () => {
    const testLocationResult = locationSearchResults[0];
    testLocationResult.display_name = "";

    let result = component.inUnitedStates(testLocationResult);

    expect(result).toBe(false);
  });

});
