import { Component, OnInit } from '@angular/core';
import {LocationType} from "../models/location";
import {LocationService} from "../services/location.service";

@Component({
  selector: 'app-bottom-menu',
  templateUrl: './bottom-menu.component.html',
  styleUrls: ['./bottom-menu.component.css']
})
export class BottomMenuComponent implements OnInit {

  public data_type: LocationType;

  constructor(private locationService: LocationService) { }

  ngOnInit() {
    this.data_type = this.locationService.getDataType();
  }

  dataTypeClick(type: number): void {
    this.data_type = type;
    this.locationService.setDataType(type);
  }

  reloadClick(): void {
    this.locationService.refreshData();
  }
}
