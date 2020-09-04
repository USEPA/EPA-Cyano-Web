import { Injectable } from '@angular/core';
import { Map, LatLng, Marker, LayerGroup, icon, Layer, marker, tileLayer } from 'leaflet';
import { Location } from '../models/location';
import { CyanMap } from '../utils/cyan-map';
import { UserService } from '../services/user.service';
import { ConcentrationRanges } from '../test-data/test-levels';
import { MapPopupComponent } from '../map-popup/map-popup.component';
import { NgElement, WithProperties } from '@angular/elements';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  cyan_ranges: ConcentrationRanges;

  marker_list = {};
  private data_source = 'OLCI';

  public mainTileLayer: string = '';

  constructor(private cyanMap: CyanMap, private userService: UserService) {}

  setMap(map: Map): void {
    this.cyanMap.map = map;
    this.cyanMap.markers = new LayerGroup();
    this.cyanMap.markers.addTo(this.cyanMap.map);
  }

  setMinimap(map: Map, mk: Marker): void {
    this.cyanMap.miniMap = map;
    this.setMiniMarker(mk);
  }

  setMiniMarker(mk: Marker): void {
    if (mk != undefined) {
      if (this.cyanMap.miniMarker != undefined && this.cyanMap.miniMap.hasLayer(this.cyanMap.miniMarker)) {
        this.cyanMap.miniMap.removeLayer(this.cyanMap.miniMarker);
      }
      this.cyanMap.miniMarker = mk;
      this.cyanMap.miniMap.addLayer(mk);
      // console.log(mk);
    }
  }

  setMiniMarkerForCompare(mk: Marker): void {
    if (mk != undefined) {
      this.cyanMap.miniMarker = mk;
      this.cyanMap.miniMap.addLayer(mk);
    }
  }

  getMap(): Map {
    return this.cyanMap.map;
  }

  getMinimap(): Map {
    return this.cyanMap.miniMap;
  }

  getMarkers(): LayerGroup {
    return this.cyanMap.markers;
  }

  hasMarker(id: number): boolean {
    if (id in this.marker_list) {
      return true;
    } else {
      return false;
    }
  }

  addMarker(ln: Location): Marker {
    let map = this.getMap();
    let m = marker(this.getLatLng(ln), {
      icon: icon({
        iconSize: [30, 36],
        iconAnchor: [13, 41],
        iconUrl: this.getMarker(ln),
        shadowUrl: 'leaflet/marker-shadow.png'
      }),
      riseOnHover: true,
      zIndexOffset: 10000
    });
    let self = this;
    m.on('click', function(e) {
      let p = self.createPopup(ln);
      map.setView(m.getLatLng(), 12);
      m.bindPopup(p).openPopup();
      m.unbindPopup();
    });
    m.bindTooltip(ln.name);
    m.on('mouseover', function(e) {
      m.openTooltip(m.getLatLng());
    });

    this.cyanMap.markers.addLayer(m);
    this.marker_list[ln.id] = m;

    return m;
  }

  updateMarker(ln: Location): void {
    let _icon = icon({
      iconSize: [30, 36],
      iconAnchor: [13, 41],
      iconUrl: this.getMarker(ln),
      shadowUrl: 'leaflet/marker-shadow.png'
    });
    let marker = this.marker_list[ln.id];
    if (marker) {
      marker.setTooltipContent(ln.name);
      marker.setIcon(_icon);
    }
  }

  deleteMarker(ln: Location): void {
    // console.log("Deleting layer from map")
    let marker = this.marker_list[ln.id];
    // console.log(marker)
    this.cyanMap.markers.removeLayer(marker);
    delete this.marker_list[ln.id];

    this.cyanMap.map.closePopup();
  }

  getSource(): string {
    return this.data_source;
  }

  changeSource(src: string): void {
    this.data_source = src === 'MERIS' ? 'MERIS' : 'OLCI';
  }

  getLatLng(ln: Location): LatLng {
    return this.cyanMap.getLocationLatLng(ln);
  }

  createPopup(ln: Location): any {
    const popup: NgElement & WithProperties<MapPopupComponent> = document.createElement('popup-element') as any;
    popup.location = ln;
    return popup;
  }

  getMarker(ln: Location): string {
    let n = ln.cellConcentration;
    let c = ln.marked;
    let userSettings = this.userService.getUserSettings();

    if (n <= userSettings.level_low) {
      if (c) {
        return 'assets/images/map_pin_green_checked.png';
      } else {
        return 'assets/images/map_pin_green_unchecked.png';
      }
    } else if (n <= userSettings.level_medium && n > userSettings.level_low) {
      if (c) {
        return 'assets/images/map_pin_yellow_checked.png';
      } else {
        return 'assets/images/map_pin_yellow_unchecked.png';
      }
    } else if (n <= userSettings.level_high && n > userSettings.level_medium) {
      if (c) {
        return 'assets/images/map_pin_orange_checked.png';
      } else {
        return 'assets/images/map_pin_orange_unchecked.png';
      }
    } else if (n >  userSettings.level_high) {
      if (c) {
        return 'assets/images/map_pin_red_checked.png';
      } else {
        return 'assets/images/map_pin_red_unchecked.png';
      }
    } else {
      if (c) {
        return 'assets/images/map_pin_green_checked.png';
      } else {
        return 'assets/images/map_pin_green_unchecked.png';
      }
    }
  }
}
