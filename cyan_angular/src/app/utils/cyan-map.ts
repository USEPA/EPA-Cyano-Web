import { Map, LatLng, LayerGroup, Marker } from 'leaflet';
import { Location } from '../models/location';
import { Injectable } from "@angular/core";

@Injectable()
export class CyanMap {
  map: Map;
  miniMap: Map;

  markers: LayerGroup;
  miniMarker: Marker;
  miniMarkers: LayerGroup;

  getLocationLatLng(ln: Location): LatLng {
    let lat = ln.latitude_deg + ln.latitude_min / 60.0 + ln.latitude_sec / 3600.0;
    let lng = ln.longitude_deg + ln.longitude_min / 60.0 + ln.longitude_sec / 3600.0;
    if (ln.latitude_dir == 'S') {
      lat = lat * -1.0;
    }
    if (ln.longitude_dir == 'W') {
      lng = lng * -1.0;
    }
    return new LatLng(lat, lng);
  }
}
