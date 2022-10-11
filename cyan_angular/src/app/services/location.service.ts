import { Injectable, Input, Directive } from "@angular/core";
import { Observable, of, Subscription, Subject } from "rxjs";
import { DomSanitizer } from "@angular/platform-browser";

import { Location, LocationType } from "../models/location";

import { UserService, UserLocations, User } from "../services/user.service";
import { DownloaderService, DataPoint } from "../services/downloader.service";
import { MapService } from "../services/map.service";
import { LoaderService } from "../services/loader.service";
import { WaterBody } from "../models/waterbody";
import { WaterBodyStatsDetails } from "../waterbody-stats/waterbody-stats-details.component";
import { EnvService } from '../services/env.service';

// @Directive()
@Injectable({
  providedIn: "root",
})
export class LocationService {
  private data_type: LocationType = LocationType.OLCI_WEEKLY;

  @Input() locations: Location[] = [];
  @Input() compare_locations: Location[] = [];

  // Inspired by: https://angular.io/guide/component-interaction#parent-and-children-communicate-via-a-service
  private compareLocationsSource = new Subject<Location[]>(); // observable Location[] sources
  compare$ = this.compareLocationsSource.asObservable(); // observable Location[] streams

  downloaderSub: Subscription;
  locationChangedSub: Subscription;
  userSub: Subscription;
  configSetSub: Subscription;

  hideWaterbodyStats: boolean = true;

  constructor(
    private _sanitizer: DomSanitizer,
    private user: UserService,
    private downloader: DownloaderService,
    private mapService: MapService,
    private loaderService: LoaderService,
    private envService: EnvService
  ) {
    this.getData();
    this.loadUser();

    this.configSetSub = this.envService.configSetObservable.subscribe(configSet => {
      if (configSet === true) {
        this.hideWaterbodyStats = this.envService.config.disableWaterbodyStats;
      }
    });

  }

  setDataType(dataType: number) {
    let origin_type = this.data_type;

    switch (dataType) {
      case 1:
        this.data_type = LocationType.OLCI_WEEKLY;
        break;
      case 2:
        this.data_type = LocationType.OLCI_DAILY;
        break;
    }
    if (origin_type != this.data_type) {
      // data type changed, reload locations
      this.refreshData();
    }
  }

  clearUserData() {
    let self = this;
    // clear all markers
    this.locations.forEach((location) => {
      self.mapService.deleteMarker(location);
    });

    // clear locations data
    this.downloader.locationsData = {};
    while (this.locations.length) {
      this.locations.pop();
    }
    while (this.compare_locations.length) {
      this.compare_locations.pop();
    }
  }

  refreshData() {
    let self = this;

    this.clearUserData();

    // fetch data
    this.downloader
      .getUserLocations(this.user.getUserName())
      .subscribe((locations: UserLocations[]) => {
        self.user.currentAccount.locations = locations;
        self.getUserLocations();
      });
  }

  getDataType() {
    return this.data_type;
  }

  loadUser() {
    let self = this;
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
    this.userSub = this.user.getUserDetails().subscribe((user: User) => {
      if (user != null) {
        if (user.username != "") {
          setTimeout(function () {
            self.getUserLocations();
          }, 1000);
        } else {
          setTimeout(function () {
            self.loadUser();
          }, 1000);
        }
      } else {
        setTimeout(function () {
          self.loadUser();
        }, 1000);
      }
    });
  }

  getUserLocations() {
    let self = this;
    this.user.getUserLocations().subscribe((locations: UserLocations[]) => {
      if (locations.length != 0) {
        self.loaderService.showProgressBar(); // uses progress bar while getting user's location data

        locations.forEach(function (location) {
          if (!self.locationIDCheck(location.id)) {
            let l = new Location();
            l.id = location.id;
            l.name = location.name;
            let coord = self.convertCoordinates(
              location.latitude,
              location.longitude
            );
            l.latitude = location.latitude;
            l.longitude = location.longitude;
            l.latitude_deg = coord.latDeg;
            l.latitude_min = coord.latMin;
            l.latitude_sec = coord.latSec;
            l.latitude_dir = coord.latDir;
            l.longitude_deg = coord.lngDeg;
            l.longitude_min = coord.lngMin;
            l.longitude_sec = coord.lngSec;
            l.longitude_dir = coord.lngDir;
            l.cellConcentration = 0;
            l.maxCellConcentration = 0;
            l.source = "";
            l.concentrationChange = 0;
            l.changeDate = "";
            l.dataDate = "";
            l.marked = location.marked == true;
            l.compare = location.compare == true;
            l.notes = location.notes;
            l.sourceFrequency = "";
            l.validCellCount = 0;

            self.locations.push(l);
            self.downloadLocation(l);

          }
        });
        self.addMarkers();
        self.updateCompareList();
      }
    });
  }

  locationIDCheck(id: number): Boolean {
    let inLocations = false;
    this.locations.forEach(function (location) {
      if (location.id == id) {
        inLocations = true;
      }
    });
    return inLocations;
  }

  getAllLocations(): Observable<Location[]> {
    return of(this.locations);
  }

  resetLocationsLatestData(): void {
    this.locations.forEach((loc) => {
      let locationDataArray = this.downloader.locationsData[loc.id].requestData.outputs;

      this.setLocationDataFromOutput(loc,
        locationDataArray.length > 0 ? locationDataArray[0] : null,
        locationDataArray.length > 1 ? locationDataArray[1] : null);
    });
  }

  setLocationDataFromOutput(loc: Location, current: DataPoint, previous: DataPoint): void {
    if (current) {
      loc.cellConcentration = Math.round(current.cellConcentration);
      loc.maxCellConcentration = Math.round(current.maxCellConcentration);
      loc.validCellCount = current.validCellsCount;
      loc.dataDate = current.imageDate.split(' ')[0];
    }
    if (current && previous) {
      loc.concentrationChange = Math.round(current.cellConcentration - previous.cellConcentration);
      loc.changeDate = previous.imageDate.split(' ')[0];
    } else {
      loc.concentrationChange = null;
      loc.changeDate = "N/A";
    }
  }

  downloadLocation(location: Location): void {
    let username = this.user.getUserName();
    this.downloader.getAjaxData(username, location, this.data_type);
  }

  getData(): void {
    if (this.downloaderSub) {
      this.downloaderSub.unsubscribe();
    }
    this.downloaderSub = this.downloader
      .getData()
      .subscribe((locations: Location[]) => {
        this.locations = locations;
      });

    if (this.locationChangedSub) {
      this.locationChangedSub.unsubscribe();
    }
    this.locationChangedSub = this.downloader.locationsChanged.subscribe(
      (loc: Location) => {
        if (loc != null) {
          this.mapService.updateMarker(loc);
          this.updateCompareLocation(loc);

          if (this.hideWaterbodyStats === false) {
            this.addWaterbodyInfo(loc);
          }
        
        }
      }
    );
  }

  getLocationData(): Observable<Location[]> {
    return of(this.locations);
  }

  // NOTE: Will not filter locations within service, set source type in my-locations
  getLocations(src: string): Observable<Location[]> {
    return of(this.locations);
  }

  getStaticLocations(): Location[] {
    return this.locations;
  }

  getLocationByID(id: number): Location {
    return this.locations.filter((ln) => {
      return ln.id == id;
    })[0];
  }

  createLocation(
    name: string,
    latitude: number,
    longitude: number,
    cellCon: number,
    maxCellCon: number,
    cellConChange: number,
    dataDate: string,
    source: string
  ): Location {

    console.log("LocationService createLocation() called.")

    let l = new Location();
    let c = this.convertCoordinates(latitude, longitude);
    l.id = this.getLastID() + 1;
    l.name = name;
    l.type = this.getDataType();
    l.latitude = latitude;
    l.longitude = longitude;
    l.latitude_deg = c.latDeg;
    l.latitude_min = c.latMin;
    l.latitude_sec = c.latSec;
    l.latitude_dir = c.latDir;
    l.longitude_deg = c.lngDeg;
    l.longitude_min = c.lngMin;
    l.longitude_sec = c.lngSec;
    l.longitude_dir = c.lngDir;
    l.cellConcentration = cellCon;
    l.maxCellConcentration = maxCellCon;
    l.concentrationChange = cellConChange;
    l.dataDate = dataDate;
    l.changeDate = dataDate;
    l.sourceFrequency = "Daily";
    l.source = source;
    l.validCellCount = 9;
    l.notes = [];
    l.marked = false;
    l.compare = false;
    l.waterbody = new WaterBody();
    l.waterbody.objectid = null;

    this.downloader.addUserLocation(this.user.getUserName(), l);
    this.locations.push(l);

    return l;
  }

  deleteLocation(ln: Location): void {
    const index = this.locations.map((loc) => loc.id).indexOf(ln.id);
    if (index >= 0) {
      this.downloader.deleteUserLocation(
        this.user.getUserName(),
        ln.id
      );
      this.locations.splice(index, 1);
    }
    // delete from compare also
    this.deleteCompareLocation(ln);
  }

  updateLocation(name: string, ln: Location): void {
    this.locations.forEach((loc) => {
      if (loc.id === ln.id) {
        loc.name = name;
        let username = this.user.getUserName();
        this.downloader.updateUserLocation(username, ln);
      }
    });
  }

  updateCompareList(): void {
    /*
    Sends updated compare list via Observable once user's
    locations are collected.
    */
    this.compare_locations = this.locations.filter(
      (location) => location.compare == true
    );
    this.compareLocationsSource.next(this.compare_locations);
  }

  getCompareLocations(): Observable<Location[]> {
    return of(this.compare_locations);
  }

  addCompareLocation(ln: Location): void {
    if (this.compare_locations == undefined) {
      this.compare_locations = [];
      this.compare_locations.push(ln);
    } else if (!this.compare_locations.includes(ln)) {
      this.compare_locations.push(ln);
    }
    this.compareLocationsSource.next(this.compare_locations); // updates Observable/Subject for subscribed components
    ln["compare"] = true;
    this.updateLocation(ln.name, ln); // updates location's 'compare' parameter
  }

  updateCompareLocation(ln: Location) {
    /*
    Updates a location in compare location array when data for the
    location is obtained.
    */
    let locIndex = this.compare_locations
      .map((item) => {
        return item.id;
      })
      .indexOf(ln.id);
    if (locIndex > -1) {
      this.compare_locations[locIndex] = ln;
      this.compareLocationsSource.next(this.compare_locations);
    }
  }

  deleteCompareLocation(ln: Location): void {
    if (this.compare_locations.includes(ln)) {
      this.compare_locations.splice(this.compare_locations.indexOf(ln), 1);
      this.compareLocationsSource.next(this.compare_locations);
      ln["compare"] = false;
      this.updateLocation(ln.name, ln); // updates location's 'compare' parameter
    }
  }

  convertCoordinates(latitude: number, longitude: number): Coordinate {
    let lat = Math.abs(latitude);
    let lng = Math.abs(longitude);

    let coordinate = new Coordinate();

    coordinate.latDeg = Math.trunc(lat);
    coordinate.lngDeg = Math.trunc(lng);

    coordinate.latMin = Math.trunc((lat - coordinate.latDeg) * 60) % 60;
    coordinate.lngMin = Math.trunc((lng - coordinate.lngDeg) * 60) % 60;

    coordinate.latSec = Math.trunc(
      (lat - coordinate.latDeg - coordinate.latMin / 60) * 3600
    );
    coordinate.lngSec = Math.trunc(
      (lng - coordinate.lngDeg - coordinate.lngMin / 60) * 3600
    );

    coordinate.latDir = latitude >= 0 ? "N" : "S";
    coordinate.lngDir = longitude >= 0 ? "E" : "W";

    return coordinate;
  }

  convertToDegrees(location: Location): Degree {
    let deg = new Degree();
    deg.latitude =
      location.latitude_deg +
      location.latitude_min / 60 +
      location.latitude_sec / 3600;
    deg.longitude =
      location.longitude_deg +
      location.longitude_min / 60 +
      location.longitude_sec / 3600;
    deg.latitude =
      location.latitude_dir == "S" ? deg.latitude * -1 : deg.latitude;
    deg.longitude =
      location.longitude_dir == "W" ? deg.longitude * -1 : deg.longitude;
    return deg;
  }

  getLastID(): number {
    let startID = 0;
    if (this.locations.length > 0) {
      let last = this.locations[0];
      this.locations.map((location) => {
        if (location.id > last.id) {
          last = location;
        }
      });
      return last.id;
    } else {
      return startID;
    }
  }

  // this returns a css style element
  getPercentage(l: Location) {
    let cells = l.cellConcentration;
    let userSettings = this.user.getUserSettings();

    let p = (cells / userSettings.level_high) * 100;
    if (p > 100) {
      p = 100;
    }
    return this._sanitizer.bypassSecurityTrustStyle(
      "conic-gradient(transparent " + p.toString() + "%, #A6ACAF 0)"
    );
  }

  // this returns a percentage 0-100
  getPercentage2(l: Location): number {
    let cells = l.cellConcentration;
    let userSettings = this.user.getUserSettings();

    let p = (cells / userSettings.level_high) * 100;
    if (p < 1) {
      p = 1;
    }
    if (p > 100) {
      p = 100;
    }
    return p;
  }

  getColor(l: Location, delta: boolean) {
    let userSettings = this.user.getUserSettings();

    let cells = l.cellConcentration;
    if (delta) {
      cells = Math.abs(l.concentrationChange);
    }
    let c = "green";
    if (cells <= userSettings.level_low) {
      c = "green";
    } else if (
      cells > userSettings.level_low &&
      cells <= userSettings.level_medium
    ) {
      c = "yellow";
    } else if (
      cells > userSettings.level_medium &&
      cells <= userSettings.level_high
    ) {
      c = "orange";
    } else if (cells > userSettings.level_high) {
      c = "red";
    }
    return c;
  }

  getArrow(l: Location): boolean {
    return l.concentrationChange > 0;
  }

  exceedAlertValue(l: Location): boolean {
    let userSettings = this.user.getUserSettings();
    let cells = l.cellConcentration;

    return userSettings.enable_alert && cells >= userSettings.alert_value;
  }

  formatNumber(n: number): string {
    let _n = Math.abs(n);
    return _n.toLocaleString();
  }

  setMarked(l: Location, m: boolean): void {
    l.marked = m;
    let username = this.user.getUserName();
    this.downloader.updateUserLocation(username, l);
  }

  addMarkers(): void {
    this.locations.forEach((location) => {
      let self = this;
      if (!self.mapService.hasMarker(location.id)) {
        this.mapService.addMarker(location);
      }
    });
  }

  updateMarkers(): void {
    this.locations.forEach((location) => {
      let self = this;
      if (self.mapService.hasMarker(location.id)) {
        this.mapService.updateMarker(location);
      }
    });
  }

  addWaterbodyInfo(ln: Location): void {
    /*
    Adds objectid to locations with available waterbody data.
    */

    this.downloader.requestsTracker += 1;

    this.downloader.searchForWaterbodyByCoords(ln.latitude, ln.longitude).subscribe(

      wbInfoResult => {

        this.downloader.requestsTracker -= 1;
        this.downloader.updateProgressBar();

        if (!wbInfoResult.hasOwnProperty('waterbodies') || wbInfoResult['waterbodies'] == 'NA') {
          return;
        }
        const index = this.locations.map((loc) => loc.id).indexOf(ln.id);
        // const tolerance = 0.1;
        wbInfoResult['waterbodies'].forEach(wbData => {
          // if (
          //   Math.abs(ln.latitude - wbData['centroid_lat']) < tolerance &&
          //   Math.abs(ln.longitude - wbData['centroid_lng']) < tolerance
          // ) {
          // Adds WB to nearest location based on tolerance
          this.locations[index].waterbody.objectid = wbData['objectid'];
          this.locations[index].waterbody.name = wbData['name'];
          this.locations[index].waterbody.centroid_lat = wbData['centroid_lat'];
          this.locations[index].waterbody.centroid_lng = wbData['centroid_lng'];
          return;
          // }
        });
      },
      error => {
        console.log("Cannot find waterbody info for location: ", ln);
        this.downloader.requestsTracker -= 1;
        this.downloader.updateProgressBar();
      }
    );

  }

}

class Coordinate {
  latDeg: number;
  latMin: number;
  latSec: number;
  latDir: string;
  lngDeg: number;
  lngMin: number;
  lngSec: number;
  lngDir: string;
}

export class Degree {
  latitude: number;
  longitude: number;
}
