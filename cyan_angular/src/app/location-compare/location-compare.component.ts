import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Location } from '../models/location';
import { LocationService } from '../services/location.service';

@Component({
  selector: 'app-location-compare',
  templateUrl: './location-compare.component.html',
  styleUrls: ['./location-compare.component.css']
})
export class LocationCompareComponent implements OnInit {
  selected_locations: Location[];

  constructor(
    private locationService: LocationService,
    private route: ActivatedRoute,
    private router: Router
   ) {}

  ngOnInit() {
    console.log(this.selected_locations);
    this.getLocations();
    if (this.selected_locations === undefined) {
      this.selected_locations = [];
    }
  }

  getLocations(): void {
    this.locationService.getCompareLocations().subscribe(locations => (this.selected_locations = locations));
  }

  removeLocation(loc: Location): void {
    this.locationService.deleteCompareLocation(loc);
  }

  hasLocations(): boolean {
    if (this.selected_locations.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  getPercentage(l: Location) {
    return this.locationService.getPercentage(l);
  }

  getColor(l: Location, delta: boolean) {
    return this.locationService.getColor(l, delta);
  }

  getArrow(l: Location) {
    return this.locationService.getArrow(l);
  }

  formatNumber(n: number) {
    return this.locationService.formatNumber(n);
  }

  compareLocations() {
    /*
    Opens location compare details.
    */
    console.log("compareLocations called.");
    this.router.navigate(['/locationcomparedetails',
      {
        locations: this.selected_locations.map((ln: Location) => ln.id),
        current_location: this.selected_locations[0].id  // testing with current_location
      }
    ]);
  }
}
