import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ajax } from 'rxjs/ajax';

import { Location } from '../models/location';
import { environment } from '../../environments/environment';

class UrlInfo {
  type: string;
  url: string;
}

class MetaInfo {
  locationName: string;
  locationLat: number;
  locationLng: number;
  description: string;
  status: string;
  requestTimestampLong: number;
  requestTimestamp: string;
  queryDateLong: number;
  queryDate: string;
  url: UrlInfo;
}

class DataPoint {
  imageDateLong: number;
  imageDate: string;
  satelliteImageType: string;
  satelliteImageFrequency: string;
  cellConcentration: number;
  maxCellConcentration: number;
  latitude: number;
  longitude: number;
  validCellsCount: number;
}

export interface LocationDataAll {
  metaInfo: MetaInfo;
  outputs: DataPoint[];
}

export class RawData {
  requestData: LocationDataAll = null;
  location: Location = null;
}

const headerOptions = {
  headers: new HttpHeaders({
    // 'Accept': 'application/json',
    // 'Content-Type': 'text/plain',
    // 'Access-Control-Allow-Origin': '*'
    'Content-Type': 'application/json'
  })
};

@Injectable({
  providedIn: 'root'
})
export class DownloaderService {
  private baseUrl: string = 'https://cyan.epa.gov/';
  private dataUrl: string = 'cyan/cyano/location/data/'; //  complete url is baseUrl + dataUrl + LAT + "/" + LNG + "/all"

  private baseServerUrl: string = environment.baseServerUrl;  // see src/environments for this value

  locationsData: any = {};
  locations: Location[] = [];


  constructor(
    private http: HttpClient
  ) {}

  registerUser(username: string, email: string, password: string) {
    let url = this.baseServerUrl + 'user/register';
    let body = { user: username, email: email, password: password };
    return this.http.post(url, body, headerOptions);
  }

  userLogin(username: string, password: string) {
    let url = this.baseServerUrl + 'user';
    let body = { user: username, password: password };
    return this.http.post(url, body, headerOptions);
  }

  loadLocations(locations: Location[]) {
    this.locations = locations;
  }

  // addUserLocation(username: string, id: number, name: string, latitude: number, longitude: number, marked: boolean, notes: object[]) {
  addUserLocation(username: string, ln: Location) {
    let url = this.baseServerUrl + 'location/add';
    let body = {
      owner: username,
      id: ln.id,
      name: ln.name,
      latitude: ln.latitude,
      longitude: ln.longitude,
      marked: ln.marked,
      notes: JSON.stringify(ln.notes)
    };

    this.executeUserLocations(url, body).subscribe();
  }

  updateUserLocation(username: string, ln: Location) {
    let url = this.baseServerUrl + 'location/edit';
    let body = {
      owner: username,
      id: ln.id,
      name: ln.name,
      marked: ln.marked,
      notes: JSON.stringify(ln.notes)
    };
    this.executeEditUserLocation(url, body).subscribe();
  }

  executeUserLocations(url: string, body: any) {
    return this.http.post(url, body, headerOptions);
  }

  editUserLocation(username: string, id: number, name: string, marked: boolean, notes: object[]) {
    let url = this.baseServerUrl + 'location/edit';
    let body = {
      owner: username,
      id: id,
      name: name,
      marked: marked,
      notes: JSON.stringify(notes)
    };
    this.executeEditUserLocation(url, body).subscribe();
  }

  executeEditUserLocation(url: string, body: any) {
    return this.http.post(url, body, headerOptions);
  }

  deleteUserLocation(username: string, id: number) {
    delete this.locationsData[id];
    let url = this.baseServerUrl + 'location/delete/' + username + '/' + id;
    this.executeDeleteUserLocation(url).subscribe();
  }

  executeDeleteUserLocation(url: string) {
    return this.http.get(url);
  }

  getUserLocation(username: string, id: number) {
    let url = this.baseServerUrl + 'location/' + username + '/' + id;
    return this.http.get(url);
  }


  updateNotification(username: string, id: number) {
    /*
    Updates user's notification, e.g., is_new set to false if clicked.
    */
    let url = this.baseServerUrl + 'notification/edit/' + username + '/' + id;
    return this.executeUpdateNotification(url).subscribe();
  }

  executeUpdateNotification(url: string) {
    return this.http.get(url);
  }

  clearUserNotifications(username: string) {
    /*
    Clears all user's notifications.
    */
    let url = this.baseServerUrl + 'notification/delete/' + username;
    this.executeClearUserNotifications(url).subscribe();
  }

  executeClearUserNotifications(url: string) {
    return this.http.get(url);
  }

// <<<<<<< HEAD

//   ajaxRequest(id: number, username: string, name: string, marked: boolean, notes: object[], url: string, newLocation: boolean) {
// =======
  // ajaxRequest(id: number, username: string, name: string, marked: boolean, url: string) {
  ajaxRequest(id: number, username: string, name: string, marked: boolean, notes: object[], url: string) {
// >>>>>>> develop
    let self = this;
    ajax(url).subscribe(data => {
      let d: LocationDataAll = data.response;
// <<<<<<< HEAD
//       let loc = self.createLocation(id, username, name, marked, notes, d, newLocation);
//       self.data.push({
//         requestData: d,
//         location: loc
//       });
//       self.locationsData[id] = {
//         requestData: d,
//         location: loc
//       };
//       let i = -1;
//       let j = 0;
//       self.locations.map(location => {
//         if (location.id == id) {
//           i = j;
//         }
//         j = j + 1;
//       });
//       if (i == -1) {
//         self.locations.push(loc);
//       } else {
//         self.locations[i] = loc;
// =======
      let loc = self.createLocation(id, username, name, marked, notes, d);

      let index = this.getLocationIndex(loc);
      // if index not found, location has been deleted by user
      if (index > -1) {
        self.locations[index] = loc;
        self.locationsData[id] = {
          requestData: d,
          location: loc
        };
// >>>>>>> develop
      }
    });
  }

// <<<<<<< HEAD
//   // getAjaxData(id: number, username: string, name: string, marked: boolean, latitude: number, longitude: number, newLocation: boolean) {
//   getAjaxData(id: number, username: string, name: string, marked: boolean, notes: object[], latitude: number, longitude: number, newLocation: boolean) {
//     let hasData: boolean = false;
//     this.data.map(d => {
//       if (d.location.id == id) {
//         hasData = true;
//       }
//     });
//     if (!hasData) {
//       let url = this.baseUrl + this.dataUrl + latitude.toString() + '/' + longitude.toString() + '/all';
//       this.ajaxRequest(id, username, name, marked, notes, url, newLocation);
// =======
  getAjaxData(username: string, ln: Location) {
    let hasData: boolean = this.locationsData.hasOwnProperty(ln.id);
    if (!hasData) {
      let url = this.baseUrl + this.dataUrl + ln.latitude.toString() + '/' + ln.longitude.toString() + '/all';
      this.ajaxRequest(ln.id, username, ln.name, ln.marked, ln.notes, url);
// >>>>>>> develop
    }
  }

  getLocationIndex(ln: Location) {
    return this.locations.map(loc => loc.id).indexOf(ln.id);
  }

  locationNotDeleted(ln: Location) {
    return this.getLocationIndex(ln) >= 0;
  }

  getData(): Observable<Location[]> {
    return of(this.locations);
  }

  getTimeSeries(): Observable<RawData[]> {
    return of(this.locationsData);
  }

// <<<<<<< HEAD
//   createLocation(id: number, username: string, name: string, marked: boolean, notes: object[], data: LocationDataAll, newLocation: boolean): Location {

// =======
  // createLocation(id: number, username: string, name: string, marked: boolean, data: LocationDataAll): Location {
  createLocation(id: number, username: string, name: string, marked: boolean, notes: object[], data: LocationDataAll): Location {
// >>>>>>> develop
    let coordinates = this.convertCoordinates(data.metaInfo.locationLat, data.metaInfo.locationLng);

    let ln = new Location();
    ln.id = id;
    if (name.indexOf('Update') == -1 && name != null) {
      ln.name = name;
    } else {
      ln.name = data.metaInfo.locationName;
    }

    // Check for "Unknown Location" as name, if so, then
    // add an incremental integer to name (e.g., "Unknown Location -- 1"):
    if (ln.name == "Unknown Location") {
      ln.name = ln.name + " -- " + ln.id;
    }

    ln.latitude_deg = coordinates.latDeg;
    ln.latitude_min = coordinates.latMin;
    ln.latitude_sec = coordinates.latSec;
    ln.latitude_dir = coordinates.latDir;
    ln.longitude_deg = coordinates.lngDeg;
    ln.longitude_min = coordinates.lngMin;
    ln.longitude_sec = coordinates.lngSec;
    ln.longitude_dir = coordinates.lngDir;

    if (data.outputs.length > 0) {
      ln.cellConcentration = Math.round(data.outputs[0].cellConcentration);
      ln.maxCellConcentration = Math.round(data.outputs[0].maxCellConcentration);
      ln.dataDate = data.outputs[0].imageDate.split(' ')[0];
      ln.source = data.outputs[0].satelliteImageType;
      ln.sourceFrequency = data.outputs[0].satelliteImageFrequency;
      ln.validCellCount = data.outputs[0].validCellsCount;

      if (data.outputs.length > 1) {
        ln.concentrationChange = Math.round(data.outputs[0].cellConcentration - data.outputs[1].cellConcentration);
        ln.changeDate = data.outputs[1].imageDate.split(' ')[0];
      } else {
        ln.concentrationChange = 0.0;
        ln.changeDate = '';
      }
    } else {
      ln.cellConcentration = 0.0;
      ln.maxCellConcentration = 0.0;
      ln.concentrationChange = 0.0;
      ln.dataDate = '';
      ln.changeDate = '';
      ln.source = '';
      ln.sourceFrequency = '';
      ln.validCellCount = 0;
    }
    // ln.notes = [];
    ln.notes = notes;
    if (marked != null) {
      ln.marked = marked;
    } else {
      ln.marked = false;
    }

// <<<<<<< HEAD
//     if (newLocation) {
//       this.addUserLocation(username, id, ln.name, data.metaInfo.locationLat, data.metaInfo.locationLng, ln.marked, notes);
// =======
    if (this.locationNotDeleted(ln)) {
      this.updateUserLocation(username, ln);
// >>>>>>> develop
    }
    return ln;
  }

  convertCoordinates(latitude: number, longitude: number): Coordinate {
    let lat = Math.abs(latitude);
    let lng = Math.abs(longitude);

    let coordinate = new Coordinate();

    coordinate.latDeg = Math.trunc(lat);
    coordinate.lngDeg = Math.trunc(lng);

    coordinate.latMin = Math.trunc((lat - coordinate.latDeg) * 60) % 60;
    coordinate.lngMin = Math.trunc((lng - coordinate.lngDeg) * 60) % 60;

    coordinate.latSec = Math.trunc((lat - coordinate.latDeg - coordinate.latMin / 60) * 3600);
    coordinate.lngSec = Math.trunc((lng - coordinate.lngDeg - coordinate.lngMin / 60) * 3600);

    coordinate.latDir = latitude >= 0 ? 'N' : 'S';
    coordinate.lngDir = longitude >= 0 ? 'E' : 'W';

    return coordinate;
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
