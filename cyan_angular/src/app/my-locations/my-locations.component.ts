import { Component, OnInit } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";

import { Location } from "../models/location";
import { LocationService } from "../services/location.service";
import { MapService } from "../services/map.service";
import { AuthService } from "../services/auth.service";

export interface Sort {
  value: string;
  viewValue: string;
}

@Component({
  selector: "app-my-locations",
  templateUrl: "./my-locations.component.html",
  styleUrls: ["./my-locations.component.css"],
})
export class MyLocationsComponent implements OnInit {
  locations: Location[];
  sorted_locations: Location[];
  selected_value: string = "name";
  sort_selection: Sort[] = [
    { value: "name", viewValue: "Location Name" },
    { value: "cellcount", viewValue: "Cell Count" },
  ];
  show_checked: boolean = false;
  locSub: Subscription;

  constructor(
    private router: Router,
    private locationService: LocationService,
    private mapService: MapService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    if (!this.authService.checkUserAuthentication()) {
      return;
    }
    this.getLocations();
    this.sortLocations();
  }

  getSource(): string {
    return this.mapService.getSource();
  }

  getLocations(): void {
    this.locSub = this.locationService
      .getLocations("")
      .subscribe((locations) => (this.locations = locations));
  }

  sortLocations(): void {
    if (this.show_checked) {
      this.sorted_locations =
        this.selected_value.localeCompare("name") == 0
          ? this.sorted_locations.sort((a, b) => a.name.localeCompare(b.name))
          : this.sorted_locations.sort(
              (a, b) => b.cellConcentration - a.cellConcentration
            );
    } else {
      this.sorted_locations =
        this.selected_value.localeCompare("name") == 0
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
        this.selected_value.localeCompare("name") == 0
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

  getColor(l: Location, delta: boolean) {
    // const color = this.locationService.getColor(l, delta);
    // if (color === 'green') { return this.colorService.green();}
    // if (color === 'yellow') { return this.colorService.yellow();}
    // if (color === 'orange') { return this.colorService.orange();}
    // if (color === 'red') { return this.colorService.red();}
    // else return this.colorService.debug();

    let color = this.locationService.getColor(l, delta);
    
    if (color === 'green') { color = 'rgb(0, 128, 0)'; }
    if (color === 'yellow') { color = 'rgb(200, 200, 0)'; }
    if (color === 'orange') { color = 'rgb(255, 165, 0)'; }
    if (color === 'red') { color = 'rgb(255, 0, 0)'; }
    return color;
  }

  getArrow(l: Location) {
    return this.locationService.getArrow(l);
  }

  // returns a css class with arrow image background
  setArrowImage(l: Location, delta: boolean) {
    const color = this.locationService.getColor(l, delta);
    if (color === "green") {
      return "green";
    }
    if (color === "yellow") {
      return "yellow";
    }
    if (color === "orange") {
      return "orange";
    }
    if (color === "red") {
      return "red";
    }
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
      "/locationdetails",
      {
        location: l.id,
        locations: this.sorted_locations.map((ln: Location) => ln.id),
      },
    ]);
  }
}
