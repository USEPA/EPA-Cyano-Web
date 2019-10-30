import { Injectable } from '@angular/core';
import { Map, LatLng, Marker, LayerGroup, icon, Layer } from 'leaflet';
import { Location } from './location';
import { CyanMap } from './cyan-map';
import { ConfigService } from './config.service';
import { ConcentrationRanges } from './test-levels';
import { MapPopupComponent } from './map-popup/map-popup.component';
import { NgElement, WithProperties } from '@angular/elements';

@Injectable({
  providedIn: 'root'
})
export class MapService {

  cyan_ranges: ConcentrationRanges;

  marker_list = {};
  private data_source = "OLCI";

  constructor(private cyanMap: CyanMap, private configService: ConfigService) {}

  setMap(map: Map): void {
    this.cyanMap.map = map;
  }

  setMinimap(map: Map, mk: Marker): void {
    this.cyanMap.miniMap = map;
    this.setMiniMarker(mk);
  }

  setMarkers(mk: Marker): void {   
    this.cyanMap.markers = new LayerGroup([mk]);
    this.cyanMap.markers.addTo(this.cyanMap.map);
  }

  setMiniMarker(mk: Marker): void {
    if(mk != undefined){
      if(this.cyanMap.miniMarker != undefined && this.cyanMap.miniMap.hasLayer(this.cyanMap.miniMarker)){
        this.cyanMap.miniMap.removeLayer(this.cyanMap.miniMarker);
      }
      this.cyanMap.miniMarker = mk;
      this.cyanMap.miniMap.addLayer(mk);
      // console.log(mk);
    }
  }

  getMap(): Map {
    return this.cyanMap.map;
  }

  getMinimap(): Map {
    return this.cyanMap.miniMap;
  }

  getMarkers(): LayerGroup{
    return this.cyanMap.markers;
  }

  hasMarker(id: number): boolean {
    if(id in this.marker_list){
      return true;
    }
    else{
      return false;
    }
  }

  addMarker(id: number, mk: Marker): void {
    if(Object.keys(this.marker_list).length == 0){
      this.setMarkers(mk);
    }
    else{
      this.cyanMap.markers.addLayer(mk);
    }
    this.marker_list[id] = mk;
    // console.log(this.marker_list);
  }

  updateMarker(ln: Location): void {
    let _icon = icon({
      iconSize: [ 30, 36 ],
      iconAnchor: [ 13, 41 ],
      iconUrl: this.getMarker(ln),
      shadowUrl: 'leaflet/marker-shadow.png'
    });
    this.marker_list[ln.id].setIcon(_icon);
  }

  deleteMarker(ln: Location): void {
    // console.log("Deleting layer from map")
    let marker = this.marker_list[ln.id];
    // console.log(marker)
    this.cyanMap.markers.removeLayer(marker);
    let m = this.cyanMap.map;
    let self = this;
    setTimeout(function(){
      m.removeLayer(self.marker_list[ln.id]);
    }, 100);
    m.closePopup();
    delete this.marker_list[ln.id];
  }

  getSource(): string {
    return this.data_source;
  }

  changeSource(src: string): void {
    this.data_source = ( src === "MERIS") ? "MERIS" : "OLCI";
  }

  getLatLng(ln: Location): LatLng{
    return this.cyanMap.getLocationLatLng(ln);
  }

  createPopup(ln: Location): any{
    const popup: NgElement & WithProperties<MapPopupComponent> = document.createElement('popup-element') as any;
    popup.location = ln;
    return popup;
  }

  getMarker(ln: Location): string {
    let n = ln.cellConcentration;
    let c = ln.marked;
    this.cyan_ranges = this.configService.getStaticLevels();
    if(n <= this.cyan_ranges.low[1]){
      if(c){
        return 'assets/images/map_pin_green_checked.png';
      }
      else{
        return 'assets/images/map_pin_green_unchecked.png';
      }
    }
    else if(n <= this.cyan_ranges.medium[1] && n >= this.cyan_ranges.medium[0]){
      if(c){
        return 'assets/images/map_pin_yellow_checked.png';
      }
      else{
        return 'assets/images/map_pin_yellow_unchecked.png';
      }
    }
    else if(n <= this.cyan_ranges.high[1] && n >= this.cyan_ranges.high[0]){
      if(c){
        return 'assets/images/map_pin_orange_checked.png';
      }
      else{
        return 'assets/images/map_pin_orange_unchecked.png';
      }
    }
    else if(n >= this.cyan_ranges.veryhigh[0]){
      if(c){
        return 'assets/images/map_pin_red_checked.png';
      }
      else{
        return 'assets/images/map_pin_red_unchecked.png';
      }
    }
    else{
      if(c){
        return 'assets/images/map_pin_green_checked.png';
      }
      else{
        return 'assets/images/map_pin_green_unchecked.png';
      }
    }
  }
}
