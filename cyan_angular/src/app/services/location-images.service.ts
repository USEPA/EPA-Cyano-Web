import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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

  getImageDetails(latitude: number, longitude: number) {
    let url = this.baseUrl + this.imageUrl + latitude.toString() + "/" + longitude.toString() + "/";
    return this.http.get(url);
  }

  getAllImages(latitude: number, longitude: number) {
		let url = this.baseUrl + this.allImagesUrl + latitude.toString() + "/" + longitude.toString() + "/";
		return this.http.get(url);
  }

}
