import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject, throwError } from 'rxjs';
import { ajax } from 'rxjs/ajax';

import { Location } from '../models/location';
import { LocationType } from '../models/location';
import { UserSettings } from '../models/settings';
import { Comment, Reply } from '../models/comment';
import { BatchJob, BatchStatus } from '../models/batch';
import { WaterBody } from '../models/waterbody';

import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { EnvService } from '../services/env.service';

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

export class DataPoint {
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


@Injectable({
  providedIn: 'root'
})
export class DownloaderService {

  private locationSubject =  new BehaviorSubject<Location>(null);
  locationsChanged = this.locationSubject.asObservable();

  locationsData: any = {};
  locations: Location[] = [];


  requestsTracker: number = 0;


  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private loaderService: LoaderService,
    private envService: EnvService
  ) { }

  registerUser(username: string, email: string, password: string) {
    let url = this.envService.config.baseServerUrl + 'user/register';
    let body = { user: username, email: email, password: password };
    return this.http.post(url, body, this.envService.getHeaders());
  }

  userLogin(username: string, password: string) {
    let url = this.envService.config.baseServerUrl + 'user';
    let body = { user: username, password: password };
    return this.http.post(url, body, this.envService.getHeaders());
  }

  addUserLocation(username: string, ln: Location) {
    let url = this.envService.config.baseServerUrl + 'location/add';
    let body = {
      owner: username,
      id: ln.id,
      name: ln.name,
      latitude: ln.latitude,
      longitude: ln.longitude,
      marked: ln.marked,
      compare: ln.compare,
      notes: ln.notes
    };
    this.executeAuthorizedPostRequest(url, body).subscribe();
  }

  updateUserLocation(username: string, ln: Location) {
    let url = this.envService.config.baseServerUrl + 'location/edit';
    let body = {
      owner: username,
      id: ln.id,
      name: ln.name,
      marked: ln.marked,
      compare: ln.compare,
      notes: ln.notes
    };
    this.executeAuthorizedPostRequest(url, body).subscribe();
  }

  deleteUserLocation(username: string, id: number) {
    delete this.locationsData[id];
    let url = this.envService.config.baseServerUrl + 'location/delete/' + id;
    this.executeDeleteUserLocation(url).subscribe();
  }

  executeDeleteUserLocation(url: string) {
    return this.executeAuthorizedGetRequest(url);
  }

  getUserLocation(username: string, id: number) {
    let url = this.envService.config.baseServerUrl + 'location/' + id;
    return this.executeAuthorizedGetRequest(url);
  }

  getUserLocations(username: string) {
    let url = this.envService.config.baseServerUrl + 'locations';
    return this.executeAuthorizedGetRequest(url);
  }

  updateNotification(username: string, id: number) {
    /*
     Updates user's notification, e.g., is_new set to false if clicked.
    */
    let url = this.envService.config.baseServerUrl + 'notification/edit/' + id;
    return this.executeUpdateNotification(url).subscribe();
  }

  executeUpdateNotification(url: string) {
    return this.executeAuthorizedGetRequest(url);
  }

  clearUserNotifications(username: string) {
    /*
    Clears all user's notifications.
    */
    let url = this.envService.config.baseServerUrl + 'notification/delete';
    this.executeClearUserNotifications(url).subscribe();
  }

  executeClearUserNotifications(url: string) {
    return this.executeAuthorizedGetRequest(url);
  }

  updateUserSettings(settings: UserSettings) {
    /*
     Updates user's settings for color configuration/alert threshold.
     */
    let url = this.envService.config.baseServerUrl + 'settings/edit';
    return this.executeAuthorizedPostRequest(url, settings);
  }

  getAllComments() {
    /*
    Gets all users' comments.
    */
    let url = this.envService.config.baseServerUrl + 'comment';
    return this.executeAuthorizedGetRequest(url);
  }

  addUserComment(comment: Comment) {
    /*
    Adds user comment.
    */
    let url = this.envService.config.baseServerUrl + 'comment';
    return this.executeAuthorizedPostRequest(url, comment);
  }

  addReplyToComment(reply: Reply) {
    /*
    Adds user reply to a user's comment.
    */
    let url = this.envService.config.baseServerUrl + 'reply';
    return this.executeAuthorizedPostRequest(url, reply);
  }

  startBatchJob(batchRequest: BatchJob) {
    /*
    Kicks off batch job on celery worker.
    */
    let url = this.envService.config.baseServerUrl + 'batch';
    return this.executeAuthorizedPostRequest(url, batchRequest);
  }

  checkBatchJobStatus(batchStatusRequest: BatchStatus) {
    /*
    Gets status of user's batch job.
    */
    let url = this.envService.config.baseServerUrl + 'batch/status';
    return this.executeAuthorizedPostRequest(url, batchStatusRequest);
  }

  cancelBatchJob(batchStatusRequest: BatchStatus) {
    /*
    Cancels user's batch job.
    */
    let url = this.envService.config.baseServerUrl + 'batch/cancel';
    return this.executeAuthorizedPostRequest(url, batchStatusRequest);
  }

  getBatchJobs(batchJob: string = "") {
    /*
    Returns batch job(s).
    */
    let url = this.envService.config.baseServerUrl + 'batch';
    return this.executeAuthorizedGetRequest(url);
  }

  getAllWaterbodies() {
    /*
    Makes request to cyan-waterbody for all available waterbodies.
    */
    let url = this.envService.config.waterbodyUrl + 'search/?name=';
    return this.executeAuthorizedGetRequest(url);
  }

  searchForWaterbodyByCoords(latitude: number, longitude: number) {
    /*
    Searches for available waterbody using lat/lon.
    */
    let url = this.envService.config.waterbodyUrl + 'search/?lat=' + latitude + '&lng=' + longitude;
    return this.executeAuthorizedGetRequest(url);
  }

  searchForWaterbodyByName(name: string) {
    /*
    Searches for available waterbody using name. 
    */
    let url = this.envService.config.waterbodyUrl + 'search/?name=' + name;
    return this.executeAuthorizedGetRequest(url);
  }

  getWaterbodyData(
    objectid: number,
    daily: string,
    startYear: number = null,
    startDay: number = null,
    endYear: number = null,
    endDay: number = null,
    // ranges: Array<any> = null
  ) {
    /*
    Gets waterbody data.
    */
    let url = this.envService.config.waterbodyUrl + 
      'data/?OBJECTID=' + objectid +
      '&daily=' + daily

    if (startYear) { url += '&start_year=' + startYear; }
    if (startDay) { url += '&start_day=' + startDay; }
    if (endYear) { url += '&end_year=' + endYear; }
    if (endDay) { url += '&end_day=' + endDay; }

    return this.executeAuthorizedGetRequest(url); 
  }

  getWaterbodyProperties(objectid: number) {
    /*
    Gets waterbody properties.
    */
    let url = this.envService.config.waterbodyUrl + 'properties/?OBJECTID=' + objectid;
    return this.executeAuthorizedGetRequest(url); 
  }

  getWaterbodyGeometry(objectid: number) {
    /*
    Gets waterbody geometry.
    */
    let url = this.envService.config.waterbodyUrl + 'geometry/?OBJECTID=' + objectid;
    return this.executeAuthorizedGetRequest(url); 
  }

  getWaterbodyImage(objectid: number, year: number, day: number, daily: string = 'True') {
    /*
    Gets waterbody image for a given date (year and day-of-year).
    */
    if (!this.authService.checkUserAuthentication()) { return; }
    let url = this.envService.config.waterbodyUrl + 
      'image/?OBJECTID=' + objectid + 
      '&year=' + year + 
      '&day=' + day;
    return this.http.get(url, {
      headers: {
        'Content-Type': 'image/png',
        'App-Name': this.envService.config.appName,
      },
      responseType: 'blob',
      observe: 'response'
    });
  }

  getConusImage(year: number, day: number, daily: string) {
    /*
    Calls waterbody backend's conus_image endpoint, e.g.,
    /waterbody/conus_image/?year=2021&day=234&daily=True
    */
    // if (!this.authService.checkUserAuthentication()) { return; }
    let url = this.envService.config.waterbodyUrl + 
      'conus_image/?year=' + year +
      '&day=' + day +
      '&daily=' + daily;

    return this.http.get(url, {
      headers: {
        'Content-Type': 'image/png',
        'App-Name': this.envService.config.appName,
      },
      // withCredentials: true,
      responseType: 'blob',
      observe: 'response'
    });
  }

  getTribes() {
    /*
    Gets tribes with available waterbodies.
    */
    if (!this.authService.checkUserAuthentication()) { return; }
    let url = this.envService.config.waterbodyUrl + 'report_form/tribes/';
    return this.executeAuthorizedGetRequest(url);
  }

  getCounties(state: string) {
    /*
    Gets counties with available waterbodies.
    */
    if (!this.authService.checkUserAuthentication()) { return; }
    let url = this.envService.config.waterbodyUrl + 'report_form/counties/?state=' + state;
    return this.executeAuthorizedGetRequest(url);
  }

  getStates() {
    /*
    Gets states with available waterbodies.
    */
    if (!this.authService.checkUserAuthentication()) { return; }
    let url = this.envService.config.waterbodyUrl + 'report_form/states/';
    return this.executeAuthorizedGetRequest(url);
  }

  // generateReport(reportType: string, reportTypeId: number, dayOfYear: string, ranges: Array<number>) {
  generateReport(reportType: string, reportTypeIds: number[], dayOfYear: string, ranges: Array<number>) {
    /*
    Starts report generation.
      * reportType - objectids, county, or tribe
      * reportTypeId - ID number for the reportType (objectids, county or tribe IDs)
      * dayOfYear - year and day-of-year for report (e.g., "2021 300")
    */
    if (!this.authService.checkUserAuthentication()) { return; }
    let url = this.envService.config.baseServerUrl + 'report';
    let postData = {
      date: dayOfYear,
      ranges: ranges
    }
    if (reportType === 'objectids') {
      postData['objectids'] = reportTypeIds;
    }
    else if (reportType === 'tribe') {
     postData['tribes'] = reportTypeIds;
    }
    else if (reportType === 'county') {
      postData['counties'] = reportTypeIds;
    }
    return this.executeAuthorizedPostRequest(url, postData);
  }

  getUserReports(reportId: string = '') {
    /*
    Gets user reports based on redport ID, or returns all of them if
    no report ID is provided.
    */
    if (!this.authService.checkUserAuthentication()) { return; }
    let url = this.envService.config.baseServerUrl + 'report';
    if (reportId.length > 0) {
      url += '/?' + reportId;
    }
    return this.executeAuthorizedGetRequest(url);
  }

  getReportStatus(reportId: string) {
    /*
    Gets status of report based on report ID.
    */
    if (!this.authService.checkUserAuthentication()) { return; }
    let url = this.envService.config.baseServerUrl + 'report/status';
    let postData = {
      report_id: reportId
    }
    return this.executeAuthorizedPostRequest(url, postData);
  }

  cancelReportRequest(reportId: string) {
    /*
    Cancels a requested report.
    NOTE: Must be user that started report as well.
    */
    if (!this.authService.checkUserAuthentication()) { return; }
    let url = this.envService.config.baseServerUrl + 'report/cancel';
    let postData = {
      report_id: reportId
    }
    return this.executeAuthorizedPostRequest(url, postData);
  }

  downloadReport(reportId: string) {
    /*
    Downloads report based on report ID.
    */
    if (!this.authService.checkUserAuthentication()) { return; }
    let url = this.envService.config.waterbodyUrl + 'report/download/?'
      + 'report_id=' + reportId;
    // return this.executeAuthorizedGetRequest(url);

    // NOTE: May need request like below:
    return this.http.get(url, {
      headers: {
        'Content-Type': 'application/pdf',
        'App-Name': this.envService.config.appName,
      },
      responseType: 'blob',
      observe: 'response'
    });
  }

  downloadMonthlyReport(state: string, year: number, month: number) {
    /*
    Requests monthly state or alpine report for a given
    year and month.
    */
    if (!this.authService.checkUserAuthentication()) { return; }

    if (!(state.length == 2 || state == 'alpine')) {
      return throwError("'state' must be two characters, e.g., TX, NC, or 'alpine'.");
    }

    else if(!(year.toString().length === 4)) {
      return throwError("'year' is not of length 4.");
    }

    else if (!(month.toString().length === 1 || month.toString().length === 2)) {
      return throwError("'month is not of length 1 or 2.");
    }

    let url = this.envService.config.waterbodyUrl + 'report/monthly/?' +
      'state=' + state +
      '&year=' + year +
      '&month=' + month;
    return this.http.get(url, {
      headers: {
        'Content-Type': 'application/pdf',
        'App-Name': this.envService.config.appName,
      },
      responseType: 'blob',
      observe: 'response'
    });
  }

  getAvailableMonthlyReports(state: string) {
    /*
    Gets available monthly reports by state (actual state or 'alpine').
    Example response: 
    {
      "reports": [
          [
              "alpine",s
              2023,
              2,
              "2023-04-27 14:11:05.078890",
              "http://localstack:4566/wb-dev-local/alpine/2023/2/CyAN-waterbody-report-alpine_2023-59.pdf",
              "SUCCESS"
          ]
      ],
      "state": "alpine"
    }
    */
    if (!this.authService.checkUserAuthentication()) { return; }

    // TODO: Validation for state, year, and month.
    if (!(state.length == 2 || state == 'alpine')) {
      console.error("'state' must be two characters, e.g., TX, NC, or 'alpine'.");
      return;
    }

    let url = this.envService.config.waterbodyUrl + 'report/state/?' +
      'state=' + state;

    return this.executeAuthorizedGetRequest(url);

  }

  downloadHistoData(objectid: number) {
    /*
    Gets histogram data for a waterbody. Returns a CSV.
    */
    if (!this.authService.checkUserAuthentication()) { return; }
    let url = this.envService.config.waterbodyUrl + 
      'data_download/?OBJECTID=' + objectid;
    return this.http.get(url, {
      headers: {
        'Content-Type': 'text/csv',
        'App-Name': this.envService.config.appName,
      },
      // responseType: 'blob',
      responseType: 'text',
      observe: 'response'
    });
  }

  getLocationImage(tifName: string, imageURL: string) {
    /*
    Gets image from location-details images.
    */
    if (!this.authService.checkUserAuthentication()) { return; }
    let url = this.envService.config.tomcatApiUrl + 'location/images/' + tifName;
    return this.http.get(url, {
      headers: {
        'Content-Type': 'image/tiff',
        'App-Name': this.envService.config.appName,
      },
      responseType: 'blob',
      observe: 'response'
    });
  }

  executeAuthorizedPostRequest(url: string, body: any) {
    if (!this.authService.checkUserAuthentication()) { return; }
    return this.http.post(url, body, this.envService.getHeaders());
  }

  executeAuthorizedGetRequest(url: string) {
    if (!this.authService.checkUserAuthentication()) { return; }
    return this.http.get(url, this.envService.getHeaders());
  }

  ajaxRequest(ln: Location, username: string, url: string) {
    let self = this;
    self.loaderService.show();
    self.requestsTracker += 1;
    ajax({
      url: url,
      crossDomain: true
    }).subscribe(data => {
      let d = data.response;
      let loc = self.createLocation(ln, username, d);
      loc.latitude = ln.latitude;
      loc.longitude = ln.longitude;
      let index = this.getLocationIndex(loc);
      // if index not found, location has been deleted by user
      if (index > -1) {
        self.locations[index] = loc;
        self.locationsData[ln.id] = {
          requestData: d,
          location: loc
        };
        self.locationSubject.next(loc);  // raise event location changed
        self.requestsTracker -= 1;
        self.updateProgressBar();
      }
    });
  }

  getAjaxData(username: string, ln: Location, datatype: LocationType = 1) {
    // Checks if token is valid before making requests:
    if (!this.authService.checkUserAuthentication()) { return; }
    let hasData: boolean = this.locationsData.hasOwnProperty(ln.id);
    if (!hasData) {
      let url = this.envService.config.tomcatApiUrl + "location/data/" + ln.latitude.toString() + '/' + ln.longitude.toString() + '/all';
      switch (datatype) {
        case LocationType.OLCI_WEEKLY:
          url += '?type=olci&frequency=weekly';
          break;
        case LocationType.OLCI_DAILY:
          url += '?type=olci&frequency=daily';
          break;
      }
      this.ajaxRequest(ln, username, url);
    }
  }

  getLocationIndex(ln: Location) {
    return this.locations.findIndex(loc => loc.id == ln.id && loc.type == ln.type);
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

  createLocation(loc: Location, username: string, data): Location {

    let coordinates = this.convertCoordinates(data.metaInfo.locationLat, data.metaInfo.locationLng);
    let name = loc.name;

    let ln = new Location();
    ln.id = loc.id;
    if (name != null && name.indexOf('Update') == -1) {
      ln.name = name;
    } else {
      ln.name = data.metaInfo.locationName;
    }
    ln.type = loc.type;

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
    ln.notes = loc.notes;
    if (loc.marked != null) {
      ln.marked = loc.marked;
    } else {
      ln.marked = false;
    }
    ln.compare = loc.compare;

    ln.waterbody = new WaterBody();
    ln.waterbody.objectid = null;

    // update only if name changed and user did not remove location before API returns
    if (ln.name != loc.name && this.locationNotDeleted(ln)) {
      ln.name = this.addUniqueId(ln);
      this.updateUserLocation(username, ln);
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

  addUniqueId(ln: Location): string {
    /*
    Creates a unique ID for location name.
    */
    let matchedLocations: Number[] = [];
    this.locations.forEach((location) => {
      if (location.name.includes(ln.name)) {
        let idNum = location.name.split(" -- ")[1];
        if (idNum != undefined && !isNaN(Number(idNum)) && !isNaN(parseInt(idNum))) {
          matchedLocations.push(Number(idNum));
        }
      }
    });
    if (matchedLocations.length == 0) {
      ln.name = ln.name + " -- 1";
    }
    else if (matchedLocations.length > 0) {
      ln.name = ln.name + " -- " + (Math.max.apply(null, matchedLocations) + 1).toString();
    }
    else {
      ln.name = ln.name;
    }
    return ln.name;
  }

  updateProgressBar(): void {
    let progressValue = 100 * (1 - (this.requestsTracker / this.locations.length));
    this.loaderService.progressValue.next(progressValue);
    if (this.requestsTracker <= 0) {
      this.loaderService.hide();
      this.loaderService.progressValue.next(0);
    }
  }

  downloadFile(filename: string, data: any) {
    /*
    Creates CSV link and clicks it for downloading.
    */
    const a = document.createElement('a');
    const blob = new Blob([data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
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
