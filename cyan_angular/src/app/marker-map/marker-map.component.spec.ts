import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from "@angular/router/testing";
import { of, Observable } from 'rxjs';
import { Map } from 'leaflet';
import * as L from 'leaflet';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';

import { MockLocation } from '../../testing/mocks/location';
import { LocationService } from '../services/location.service';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { MarkerMapComponent } from './marker-map.component';

describe('MarkerMapComponent', () => {

  let component: MarkerMapComponent;
  let fixture: ComponentFixture<MarkerMapComponent>;
  let testLocation: MockLocation = new MockLocation();
  let routerSpy;
  let tileSpy;
  let compLocSpy;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        RouterTestingModule,
        LeafletModule
      ],
      declarations: [ MarkerMapComponent ],
      providers: [
        AuthService,
        LoaderService,
        CyanMap,
        {
          provide: UserService,
          useClass: MockUserService
        },
        {
          provide: LocationService,
          useClass: MockLocationService
        }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    // spyOn(component, 'getLocations');
    // spyOn<any>(component['user'], 'getUserName')
    //   .and.returnValue(testUser);
    // spyOn<any>(component['ngLocation'], 'path')
    //   .and.returnValue(testPath);
    // let routerSpy = spyOn<any>(component['router'], 'navigate');
    MarkerMapComponent.prototype.ngOnInit = () => {};  // skips ngOnInit
    fixture = TestBed.createComponent(MarkerMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    tileSpy = spyOn(component, 'tileLayerEvents');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // it('should test ngOnInit - navigate to /account', () => {
  //   const testPath = '/';
  //   const testUser = '';
  //   spyOn(component, 'getLocations');
  //   spyOn<any>(component['user'], 'getUserName')
  //     .and.returnValue(testUser);
  //   spyOn<any>(component['ngLocation'], 'path')
  //     .and.returnValue(testPath);
  //   let routerSpy = spyOn<any>(component['router'], 'navigate');

  //   component.ngOnInit();

  //   expect(tileSpy).toHaveBeenCalledWith(['/account']);
  // });

  it('should test tileLayerEvents', () => {
    tileSpy.and.callThrough();
    let imagerySpy = spyOn<any>(component['esriImagery'], 'on')
      .and.returnValue(null);
    
    component.tileLayerEvents();

    expect(imagerySpy).toHaveBeenCalled();
  });

  it('should test mapPanEvent - unauthenticated', () => {
    const testEvent = null;
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(false);

    let result = component.mapPanEvent(testEvent);

    expect(result).toBeUndefined();
  });

  it('should test mapPanEvent - refresh from panning', () => {
    const testEvent = null;
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);
    let authSpy = spyOn<any>(component['authService'], 'refresh');

    let result = component.mapPanEvent(testEvent);

    expect(authSpy).toHaveBeenCalled();
  });

  it('should test getLocations', () => {
    let locSpy = spyOn<any>(component['locationService'], 'getLocations')
      .and.returnValue(of(null));

    component.getLocations();

    expect(locSpy).toHaveBeenCalled();
  });

  it('should test onMapReady', () => {
    let mapDomObj = document.createElement('div');
    mapDomObj.classList.add('map');
    const testMap = L.map(mapDomObj, {center: [34, -81], zoom: 12});
    let mapSpy = spyOn<any>(component['mapService'], 'setMap');

    component.onMapReady(testMap);

    expect(mapSpy).toHaveBeenCalled();
  });

  it('should test addMarkerOnClick - unauthenticated', () => {
    const testEvent = null;
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(false);

    let result = component.mapPanEvent(testEvent);

    expect(result).toBeUndefined();
  });

  it('should test addMarkerOnClick - map service addMarker called', () => {
    const testEvent = {
      latlng: {
        lat: 34,
        lng: -81
      }
    };
    let testMarkerEvent = new MockMarker();
    let testMap = new MockMap();
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);
    spyOn<any>(component['mapService'], 'getMap')
      .and.returnValue(testMap);  
    let mapSpy = spyOn<any>(component['mapService'], 'addMarker')
      .and.returnValue(new MockMarker());

    component.addMarkerOnClick(testEvent);

    expect(mapSpy).toHaveBeenCalled();
  });

});

class MockUserService {
  getUserName(): string {
    return "testUser";
  }
}

class MockLocationService {
  loadUser(): void {

  }
  getLocations(): Observable<MockLocation[]> {
    return of([new MockLocation]);
  }
  createLocation(name, lat, lng, cellCon, maxCellCon, cellChange, dataDate, source) {
    return new MockLocation();
  }
}

class MockMap {
  setView(latLon, zoom) {
    return;
  }
}

class MockMarker {
  fireEvent(event) {
    return;
  }
}