import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { Location } from '../models/location';
import { LocationService } from '../services/location.service';
import { MapService } from '../services/map.service';
import { AuthService } from '../services/auth.service';
import { ConfigService } from '../services/config.service';
import { WaterbodyStatsComponent } from '../waterbody-stats/waterbody-stats.component';
import { DialogComponent } from '../shared/dialog/dialog.component';
import { DownloaderService } from '../services/downloader.service';

export interface Sort {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-my-locations',
  templateUrl: './my-locations.component.html',
  styleUrls: ['./my-locations.component.css'],
})
export class MyLocationsComponent implements OnInit {
  locations: Location[];
  sorted_locations: Location[];
  selected_value: string = 'name';
  sort_selection: Sort[] = [
    { value: 'name', viewValue: 'Location Name' },
    { value: 'cellcount', viewValue: 'Cell Count' },
  ];
  show_checked: boolean = false;
  locSub: Subscription;

  meter_value;

  constructor(
    private router: Router,
    private locationService: LocationService,
    private mapService: MapService,
    private authService: AuthService,
    private configService: ConfigService,
    private messageDialog: MatDialog,
    private waterbodyStats: WaterbodyStatsComponent,
    private dialog: DialogComponent,
    private downloader: DownloaderService
  ) {}

  ngOnInit() {
    if (!this.authService.checkUserAuthentication()) {
      return;
    }
    this.getLocations();
    this.sortLocations();
  }

  ngOnDestroy() {
    this.waterbodyStats.ngOnDestroy();
  }

  getSource(): string {
    return this.mapService.getSource();
  }

  getLocations(): void {
    this.locSub = this.locationService
      .getLocations('')
      .subscribe((locations) => {
        this.locations = locations
    });
  }

  sortLocations(): void {
    if (this.show_checked) {
      this.sorted_locations =
        this.selected_value.localeCompare('name') == 0
          ? this.sorted_locations.sort((a, b) => a.name.localeCompare(b.name))
          : this.sorted_locations.sort(
              (a, b) => b.cellConcentration - a.cellConcentration
            );
    } else {
      this.sorted_locations =
        this.selected_value.localeCompare('name') == 0
          ? this.locations.sort((a, b) => a.name.localeCompare(b.name))
          : this.locations.sort(
              (a, b) => b.cellConcentration - a.cellConcentration
            );
    }
  }

  toggleChecked(): void {
    this.show_checked = !this.show_checked;
    this.filterLocations();
  }

  filterLocations(): void {
    if (this.show_checked) {
      this.sorted_locations = this.sorted_locations.filter((a) => {
        return a.marked == true;
      });
    } else {
      this.sorted_locations =
        this.selected_value.localeCompare('name') == 0
          ? this.locations.sort((a, b) => a.name.localeCompare(b.name))
          : this.locations.sort(
              (a, b) => b.cellConcentration - a.cellConcentration
            );
    }
  }

  hasLocations(): boolean {
    if (this.locations.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  getPercentage(l: Location) {
    return this.locationService.getPercentage(l);
  }

  getPercentage2(l: Location) {
    return this.locationService.getPercentage2(l);
  }

  getColor(l: Location, delta: boolean) {
    let color = this.locationService.getColor(l, delta); // gets color based on user's settings
    return this.configService.getColorRgbValue(color);
  }

  getArrow(l: Location) {
    return this.locationService.getArrow(l);
  }

  // returns a css class with arrow image background
  getArrowColor(l: Location, delta: boolean) {
    return this.locationService.getColor(l, delta);
  }

  exceedAlertValue(l: Location) {
    return this.locationService.exceedAlertValue(l);
  }

  formatNumber(n: number) {
    return this.locationService.formatNumber(n);
  }

  locationSelect(event: any, l: Location) {
    if (!this.authService.checkUserAuthentication()) {
      return;
    }
    this.router.navigate([
      '/locationdetails',
      {
        location: l.id,
        locations: this.sorted_locations.map((ln: Location) => ln.id),
      },
    ]);
  }

  locationMouseEnter(event, location) {
    /*
    Mouse event for a location in the My Locations list.
    */
    let markers = this.mapService.getMarkers();
    for (let key of Object.keys(markers['_layers'])) {
      let layer = markers['_layers'][key];
      if (layer.options.alt.includes(location.name)) {
        layer.fire('mouseover');
      }
    }

  }
  
  locationMouseLeave(event, location) {
    /*
    Mouse event for a location in the My Locations list.
    */
    let markers = this.mapService.getMarkers();
    for (let key of Object.keys(markers['_layers'])) {
      let layer = markers['_layers'][key];
      if (layer.options.alt.includes(location.name)) {
        layer.fire('mouseout');
      }
    }

  }

  downloadLocationsAsCsv() {
    /*
    Downloads CSV of user locations. Can be used
    in the "Request Data" feature.
    */
    if (!this.authService.checkUserAuthentication()) { return; }
    let dialogRef = this.dialog.displayMessageDialog('Download location data as CSV?');
    dialogRef.afterClosed().subscribe(response => {
      if (response !== true) {
        return;
      }
      let chartData = this.curateChartData(this.sorted_locations);
      let currentUtcTime = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
      const filename = 'CyanwebLocations_' + currentUtcTime;
      this.downloader.downloadFile(filename, chartData);
    });
  }

  curateChartData(locations: Location[]): string {
    /*
    Gets data from chart data for CSV download.
    */
    let csvArray = [];
    if (locations.length < 1) {
      this.dialog.handleError('No locations exist for generating CSV.');
    }
    locations.forEach((item, index) => {
      csvArray.push({'name': item.name, 'latitude': item.latitude, 'longitude': item.longitude, 'type': item.sourceFrequency.toLowerCase()})
    });
    const replacer = (key, value) => (value === null ? '' : value); // specify how you want to handle null values here
    const header = ['name', 'latitude', 'longitude', 'type'];
    const csv = csvArray.map((row) =>
      header
        .map((fieldName) => JSON.stringify(row[fieldName], replacer))
        .join(',')
    );
    csv.unshift(header.join(','));
    return csv.join('\r\n');
  }
  
}
