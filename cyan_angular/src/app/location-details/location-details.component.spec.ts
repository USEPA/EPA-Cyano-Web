import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from "@angular/router/testing";
import { HttpClientModule } from '@angular/common/http';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { of, Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import * as L from 'leaflet';
import { ImageOverlay, latLng, latLngBounds, LatLng } from 'leaflet';
import { DatePipe } from '@angular/common';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';

import { ImageDetails } from '../models/image-details';
import { Location } from '../models/location';
import { MockLocation } from '../../testing/mocks/location';
import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { Degree } from '../services/location.service';
import { CyanMap } from '../utils/cyan-map';
import { EnvService } from '../services/env.service';
import { DownloaderService } from '../services/downloader.service';
import { LocationService } from '../services/location.service';
import { MarkerMapComponent } from '../marker-map/marker-map.component';
import { LocationDetailsComponent, LocationDetailsNotes } from './location-details.component';

let latestImageJson = require('../../testing/mocks/all-images-response.json');
let rawDataJson = require('../../testing/mocks/raw-data-response.json');

describe('LocationDetailsComponent', () => {

  let component: LocationDetailsComponent;
  let fixture: ComponentFixture<LocationDetailsComponent>;
  let testLocation: Location = new MockLocation();
  let testImageDetails: ImageDetails = { 
    name: 'test image',
    width: null,
    height: null,
    format: null,
    thumb: null,
    thumbDependencyImageName: null,
    coordinates: null,
    satelliteImageType: null,
    satelliteImageFrequency: null
  };
  let tsSubSpy;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientModule,
        MatBottomSheetModule
      ],
      declarations: [ LocationDetailsComponent ],
      providers: [
        AuthService,
        LoaderService,
        CyanMap,
        MarkerMapComponent,
        {
          provide: ActivatedRoute,
          useValue: {
            params: of(
            {
              location: testLocation.id,
              locations: testLocation.id + ','
            })
          }
        },
        {
          provide: EnvService,
          useValue: {
            config: {
              tomcatApiUrl: ''
            }
          }
        }
      ]
    })
    .compileComponents();

    let mapDomObj = document.createElement('div');
    mapDomObj.classList.add('map');

  }));

  beforeEach(() => {
    LocationDetailsComponent.prototype.ngOnInit = () => {};  // skips ngOnInit
    LocationDetailsComponent.prototype.ngOnDestroy = () => {};  // skips ngOnDestroy
    fixture = TestBed.createComponent(LocationDetailsComponent);
    component = fixture.componentInstance;
    component.current_location = testLocation;
    component.locations = [testLocation];
    component.dataDownloaded = true;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // it('should test ngOnInit() - unauthenticated', () => {
  //   spyOn<any>(component['authService'], 'checkUserAuthentication')
  //     .and.returnValue(false);

  //   let result = component.ngOnInit();

  //   expect(result).toBeUndefined();
  // });

  // it('should test ngOnInit() - authenticated, downloadTimeSeries gets called', () => {
  //   spyOn<any>(component['authService'], 'checkUserAuthentication')
  //     .and.returnValue(true);
  //   spyOn<any>(component['locationService'], 'getLocationByID')
  //     .and.returnValue(testLocation);
  //   spyOn<any>(component['locationService'], 'getStaticLocations');
  //   let downloadSpy = spyOn(component, 'downloadTimeSeries');
  //   let getImagesSpy = spyOn(component, 'getImages');
  //   spyOn<any>(component['locationService'], 'getLocations')
  //     .and.returnValue(of([testLocation]));
  //   component.dataDownloaded = true;

  //   component.ngOnInit();

  //   expect(component.tsTicker).toEqual(1);
  //   expect(downloadSpy).toHaveBeenCalled();
  // });

  // it('should test ngOnDestroy', () => {
  //   spyOn(component, 'clearLayerImages');
  //   let locSpy = spyOn<any>(component['locationService'], 'resetLocationsLatestData');

  //   component.ngOnDestroy();

  //   expect(locSpy).toHaveBeenCalled();
  // });

  it('should test removeThumbHighlights', () => {
    const testThumb = document.createElement('div');
    const testThumbParent = document.createElement('div');
    testThumb.classList.add('details_thumb');
    testThumbParent.classList.add('details_thumb_parent');

    let result = component.removeThumbHighlights();

    expect(result).toBeDefined();
  });

  it('should test highlightFirstThumb()', () => {
    const testThumb1 = document.createElement('div');
    const testThumb2 = document.createElement('div');
    const testThumbParent = document.createElement('div');
    testThumb1.classList.add('details_thumb');
    testThumb2.classList.add('details_thumb');
    testThumbParent.classList.add('details_thumb_parent');
    spyOn(component, 'removeThumbHighlights')
      .and.returnValue(document.getElementsByClassName('details_thumb'));
    let togSpy = spyOn(component, 'toggleImage');

    component.highlightFirstThumb();
    fixture.detectChanges();

    fixture.whenStable().then(() => {
      expect(togSpy).toHaveBeenCalled();
    });

  });

  it('should test getImages', () => {
    const testDegree = new Degree();
    testDegree.latitude = 34;
    testDegree.longitude = -81;
    spyOn(component, 'clearImages');
    spyOn<any>(component['locationService'], 'convertToDegrees')
      .and.returnValue(testDegree);
    let imageSpy = spyOn<any>(component['images'], 'getImageDetails')
      .and.returnValue(of([testImageDetails]));
    spyOn(component, 'setImages');

    component.getImages();

    // expect(component.imageCollection[0].name).toMatch(testImageDetails.name);
    expect(imageSpy).toHaveBeenCalled();
  });

  it('should test setImages', () => {
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

  it('should test toggleSlideShow', () => {
    component.slidershow = true;
    let cycleSpy = spyOn(component, 'cycleImages');
    let routerSpy = spyOn<any>(component['router'], 'isActive')
      .and.returnValue(true);

    component.toggleSlideShow();

    expect(routerSpy).toHaveBeenCalled();
  });

  it('should test getImageUrl', () => {
    const testImageName = 'test-image';
    const imageUrlResult = 'location/images/' + testImageName;
    
    let result = component.getImageUrl(testImageName);

    expect(result).toMatch(imageUrlResult);
  });

  it('should test cycleImages - no group selected', () => {
    component.tabGroup = new MockTabGroup();
    component.tabGroup.selectedIndex = 1;

    let result = component.cycleImages();

    expect(result).toBeUndefined();
  });

  it('should test cycleImages - selectedLayerIndex undefined', () => {
    component.tabGroup = new MockTabGroup();
    component.tabGroup.selectedIndex = 0;
    component.selectedLayerIndex = 0;
    component.locationPNGs = [];
    spyOn(component, 'removeThumbHighlights');
    spyOn<any>(component['mapService'], 'getMinimap');

    let result = component.cycleImages();

    expect(result).toBeUndefined();
  });

  it('should test cycleImages - success', () => {
    const testImageName = 'test-image';
    const imageUrlResult = 'location/images/' + testImageName;
    let mapDomObj = document.createElement('div');
    mapDomObj.classList.add('map');
    const testMap = L.map(mapDomObj, {center: [34, -81], zoom: 12});
    // const testLayer = new MockLocation();
    const testLayer = new ImageOverlay('', null, null);
    component.layer = testLayer;
    component.tabGroup = new MockTabGroup();
    component.tabGroup.selectedIndex = 0;
    component.selectedLayerIndex = 0;
    component.locationPNGs = latestImageJson;
    spyOn(component, 'removeThumbHighlights');
    spyOn<any>(component['mapService'], 'getMinimap')
      .and.returnValue(testMap);
    spyOn(component, 'updateDetails');
    spyOn(component, 'getImageUrl')
      .and.returnValue(imageUrlResult);
    let togSpy = spyOn(component, 'toggleSlideShow');

    component.cycleImages();

    expect(togSpy).toHaveBeenCalled();
  });

  it('should test updateDetails - unauthenticated', () => {
    const selectedIndex = 0;
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(false);

    let result = component.updateDetails(selectedIndex);

    expect(result).toBeUndefined();
  });

  it('should test updateDetails - selectedIndex undefined', () => {
    const selectedIndex = -1;
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);

    let result = component.updateDetails(selectedIndex);

    expect(result).toBeUndefined();
  });  

  // fit('should test updateDetails - success', () => {
  //   const selectedIndex = 0;
  //   component.current_location
  //   spyOn<any>(component['authService'], 'checkUserAuthentication')
  //     .and.returnValue(true);
  //   // spyOn<any>(component['downloader'], 'locationsData')
  //   //   .and.returnValue(rawDataJson);
  //   // component.downloader.locationsData = [rawDataJson]

  //   let result = component.updateDetails(selectedIndex);

  //   expect(result).toBeUndefined();
  // }); 

  it('should test clearLayerImages - unauthenticated', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(false);

    let result = component.clearLayerImages();

    expect(result).toBeUndefined();
  });

  it('should test clearLayerImages - unauthenticated', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);
    let removeSpy = spyOn(component, 'removeThumbHighlights');

    component.clearLayerImages();

    expect(removeSpy).toHaveBeenCalled();
    expect(component.slidershow).toBe(false);
  });

  it('should test toggleImage - unauthenticated', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(false);

    let result = component.toggleImage(null, testImageDetails);

    expect(result).toBeUndefined();
  });

  it('should test toggleImage - selectedLayer is null', () => {
    const testThumb = document.createElement('div');
    testThumb.classList.add('details_thumb');
    let mapDomObj = document.createElement('div');
    mapDomObj.classList.add('map');
    const testMap = L.map(mapDomObj, {center: [34, -81], zoom: 12});
    spyOn<any>(component['mapService'], 'getMinimap')
      .and.returnValue(testMap);
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);
    spyOn(component, 'updateDetails');

    component.locationPNGs = latestImageJson;
    testImageDetails.name = null;

    let result = component.toggleImage(testThumb, testImageDetails);

    expect(result).toBeUndefined();
  });

  it('should test toggleImage - selectedLayer is pngImage', () => {
    const testThumb = document.createElement('div');
    testThumb.classList.add('details_thumb');
    let mapDomObj = document.createElement('div');
    mapDomObj.classList.add('map');
    const testMap = L.map(mapDomObj, {center: [34, -81], zoom: 12});
    const testLayer = new ImageOverlay('', null, null);
    component.layer = testLayer;
    component.locationPNGs = latestImageJson;
    component.selectedLayer = latestImageJson[0];
    spyOn<any>(component['mapService'], 'getMinimap')
      .and.returnValue(testMap);
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);
    spyOn(component, 'updateDetails');
    testImageDetails.name = null;

    let result = component.toggleImage(testThumb, testImageDetails);

    expect(result).toBeUndefined();
  });

  it('should test getImageTitle - blank image returns blank string', () => {
    const testImage = null;

    let result = component.getImageTitle(testImage);

    expect(result.length).toEqual(0);
  });

  it('should test getImageTitle - creates image title', () => {
    const testImage = latestImageJson[0];
    const expectedResult = 'L 1/16/2021';

    let result = component.getImageTitle(testImage);

    expect(result.length).toEqual(expectedResult.length);
  });

  it('should test getImageName', () => {
    const expectedResult = 'L20210102021016';
    component.selectedLayer = latestImageJson[0];

    let result = component.getImageName();

    expect(result).toMatch(expectedResult);
  });

  it('should test getImageDate', () => {
    const testImageTitle = 'L 1/16/2021';
    const expectedResult = '1/16/2021';
    component.selectedLayer = latestImageJson[0];
    spyOn(component, 'getImageTitle')
      .and.returnValue(testImageTitle);

    let result = component.getImageDate();

    expect(result).toMatch(expectedResult);
  });

  it('should test getImageDate2', () => {
    const testImageTitle = 'L 1/16/2021';
    const expectedResult = '1/16/2021';
    // component.selectedLayer = latestImageJson[0];
    spyOn(component, 'getImageTitle')
      .and.returnValue(testImageTitle);

    let result = component.getImageDate2(latestImageJson[0]);

    expect(result).toMatch(expectedResult);
  });

  it('should test changeOpacity', () => {
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

  it('should test updateFilter', () => {
    const testImageTitle = 'L 1/16/2021';
    const testStartDate = new Date(2021, 0, 1);
    const testEndDate = new Date(2021, 0, 21);
    component.locationPNGs = latestImageJson;
    component.startDate = testStartDate;
    component.endDate = testEndDate;
    spyOn(component, 'getImageTitle')
      .and.returnValue(testImageTitle)

    component.updateFilter();

    expect(component.filteredPNGs[0].name).toMatch(latestImageJson[0].name);
  });

  it('should test downloadImage - unauthenticated', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(false);

    let result = component.downloadImage(null, latestImageJson[0]);

    expect(result).toBeUndefined();
  });

  it('should test downloadImage - success', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);
    let windowSpy = spyOn<any>(window, 'open');

    component.downloadImage(null, latestImageJson[0]);

    expect(windowSpy).toHaveBeenCalled();
  });

  it('should test downloadTimeSeries', () => {
    spyOn<any>(component['locationService'], 'downloadLocation');
    spyOn<any>(component['downloader'], 'getTimeSeries')
      .and.returnValue(of(rawDataJson));

    component.downloadTimeSeries();

    expect(component.dataDownloaded).toBe(true);
  });

  it('should test previousLocation - unauthenticated', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(false);

    let result = component.previousLocation();

    expect(result).toBeUndefined();
  });

  it('should test previousLocation - success', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);
    let changeMarkerSpy = spyOn(component, 'changeMarker');
    let getImagesSpy = spyOn(component, 'getImages');
    let clearImagesSpy = spyOn(component, 'clearImages');
    let downloadTimeSeriesSpy = spyOn(component, 'downloadTimeSeries');
    component.tsSub = new Subscription();

    let result = component.previousLocation();

    expect(changeMarkerSpy).toHaveBeenCalled();
    expect(getImagesSpy).toHaveBeenCalled();
    expect(clearImagesSpy).toHaveBeenCalled();
    expect(downloadTimeSeriesSpy).toHaveBeenCalled();
  });

  it('should test nextLocation - unauthenticated', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(false);

    let result = component.nextLocation();

    expect(result).toBeUndefined();
  });

  it('should test nextLocation - success', () => {
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);
    let changeMarkerSpy = spyOn(component, 'changeMarker');
    let getImagesSpy = spyOn(component, 'getImages');
    let clearImagesSpy = spyOn(component, 'clearImages');
    let downloadTimeSeriesSpy = spyOn(component, 'downloadTimeSeries');
    component.tsSub = new Subscription();

    let result = component.nextLocation();

    expect(changeMarkerSpy).toHaveBeenCalled();
    expect(getImagesSpy).toHaveBeenCalled();
    expect(clearImagesSpy).toHaveBeenCalled();
    expect(downloadTimeSeriesSpy).toHaveBeenCalled();
  });

  it('should test exit - navigates /mylocations', () => {
    let routerSpy = spyOn<any>(component['router'], 'navigate');

    component.exit();

    expect(routerSpy).toHaveBeenCalledWith(['/mylocations']);
  });

  it('should test toggleLegend', () => {
    component.showLegend = false;

    component.toggleLegend();

    expect(component.showLegend).toBe(true);
  });

  it('should test onMapReady() - map gets called', () => {
    let mapDomObj = document.createElement('div');
    mapDomObj.classList.add('map');
    const testMap = L.map(mapDomObj, {center: [34, -81], zoom: 12});
    let testLatLon = new LatLng(testLocation.latitude, testLocation.longitude);
    let latLonArray = [];
    latLonArray.push(testLatLon);
    spyOn<any>(component['authService'], 'checkUserAuthentication')
      .and.returnValue(true);
    let mapSpy = spyOn<any>(component['mapService'], 'setMinimap');
    spyOn(testMap, 'invalidateSize');
    spyOn(testMap, 'flyToBounds');

    component.onMapReady(testMap);

    expect(mapSpy).toHaveBeenCalled();
  });

  it('should test changeMarker', () => {
    spyOn<any>(component['mapService'], 'setMiniMarker');
    spyOn<any>(component['mapService'], 'getLatLng');
    let mapSpy = spyOn<any>(component['mapService'], 'getMinimap')
      .and.returnValue(new MockGetMiniMap());

    component.changeMarker();

    expect(mapSpy).toHaveBeenCalled();
  });

  it('should test getArrow()', () => {
    let locSpy = spyOn<any>(component['locationService'], 'getArrow')
      .and.returnValue(false);

    component.getArrow(testLocation);

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

  it('should test formatNumber()', () => {
    const testNumber = 0.75;
    let locSpy = spyOn<any>(component['locationService'], 'formatNumber')
      .and.returnValue(testNumber);

    component.formatNumber(testNumber);

    expect(locSpy).toHaveBeenCalled();
  });

  it('should test getPercentage', () => {
    const testPercentage: number = 0;
    let locSpy = spyOn<any>(component['locationService'], 'getPercentage')
      .and.returnValue(testPercentage);

    component.getPercentage(testLocation);

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

  // fit('should test addNote', () => {
  //   // let locSpy = spyOn<any>(component['locationService'], 'updateLocation');
  //   let notesComponent = new LocationDetailsNotes(null, new DatePipe('en-US'), new LocationService());
  //   // let locSpy = spyOn<any>(notesComponent['locationService'], 'updateLocation');
  //   var testTextArea = document.createElement('textarea');
  //   var text = document.createTextNode('test text for note');
  //   testTextArea.appendChild(text);
  //   document.body.appendChild(testTextArea);
  //   testTextArea.setAttribute('id', 'note-textarea');

  //   console.log(testLocation.notes)
  //   notesComponent.addNote(testLocation);

  //   console.log(testLocation.notes)
  //   // expect().toHaveBeenCalled();
  // });

});

class MockTabGroup {
  selectedIndex() {
    return null;
  }
};

class MockLayer {
  removeFrom() {
    return null;
  }
  addTo() {
    return null;
  }
};

class MockDownloader {

  locationsData = rawDataJson;

  getTimeSeries() {
    return of(rawDataJson);
  }


  // locationsData = [];

  // let locationDataArray = this.downloader.locationsData[this.current_location.id].requestData.outputs;
  // // spyOn<any>(component['downloader'], 'locationsData')
  //   //   .and.returnValue(rawDataJson);
  //   component.downloader.locationsData = [rawDataJson]

  // this.tsSub = this.downloader.getTimeSeries().subscribe((rawData: RawData[]) => {
  //   spyOn<any>(component['downloader'], 'getTimeSeries')
  //     .and.returnValue(of(rawDataJson));

}

class MockGetMiniMap {
  flyTo() {
    return null;
  }
}

class MockLocationService {
  updateLocation() {
    return null;
  }
}