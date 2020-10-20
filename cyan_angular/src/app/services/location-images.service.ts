import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {LocationType} from "../models/location";
import { environment } from '../../environments/environment';

const headerOptions = {
  headers: new HttpHeaders({})
};

@Injectable({
  providedIn: 'root'
})
export class LocationImagesService {

  private baseUrl: string = environment.tomcatApiUrl;
  private imageUrl: string = "location/images/";
	private allImagesUrl: string = "location/allImages/";

  constructor(private http: HttpClient) { }

  getImageDetails(latitude: number, longitude: number, locationType: LocationType) {
    let url = this.baseUrl + this.imageUrl + latitude.toString() + "/" + longitude.toString() + "/";
    url = this.addImagesParameter(url, locationType);
    return this.http.get(url);
  }

  getAllImages(latitude: number, longitude: number, locationType: LocationType) {
		let url = this.baseUrl + this.allImagesUrl + latitude.toString() + "/" + longitude.toString() + "/";
    url = this.addImagesParameter(url, locationType);
		return this.http.get(url);
  }

  addImagesParameter(url: string, locationType: LocationType) {
    switch (locationType) {
      case LocationType.OLCI_WEEKLY:
        url += '?type=olci&frequency=weekly';
        break;
      case LocationType.OLCI_DAILY:
        url += '?type=olci&frequency=daily';
        break;
    }
    return url;
  }
}
