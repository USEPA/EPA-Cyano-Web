import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {LocationType} from "../models/location";

const headerOptions = {
  headers: new HttpHeaders({})
};

@Injectable({
  providedIn: 'root'
})
export class LocationImagesService {

  private baseUrl: string = "https://cyan.epa.gov/";
  private imageUrl: string = "cyan/cyano/location/images/";
	private allImagesUrl: string = "cyan/cyano/location/allImages/";

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
