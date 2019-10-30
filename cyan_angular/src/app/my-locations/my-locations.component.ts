import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { Location } from '../location';
import { LocationService } from '../location.service';
import { MapService } from '../map.service';

export interface Sort {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-my-locations',
  templateUrl: './my-locations.component.html',
  styleUrls: ['./my-locations.component.css']
})
export class MyLocationsComponent implements OnInit {

  locations: Location[];
  sorted_locations: Location[];
  selected_value: string = "name";
  sort_selection: Sort[] = [
    {value: "name", viewValue: "Location Name"},
    {value: "cellcount", viewValue: "Cell Count"}
  ];
  show_checked: boolean = false;
  locSub: Subscription;

  constructor(private router: Router, private locationService: LocationService, private mapService: MapService, private _sanitizer: DomSanitizer) { }

  ngOnInit() {
    this.getLocations();
    this.sortLocations();
  }

  getSource(): string {
    return this.mapService.getSource();
  }

  getLocations(): void {
    this.locSub = this.locationService.getLocations("").subscribe(locations => this.locations = locations);
  }

  sortLocations(): void {
    if(this.show_checked){
      this.sorted_locations = (this.selected_value.localeCompare("name") == 0) ? this.sorted_locations.sort((a,b) => a.name.localeCompare(b.name)) : this.sorted_locations.sort((a,b) => b.cellConcentration - a.cellConcentration );
    }
    else{
      this.sorted_locations = (this.selected_value.localeCompare("name") == 0) ? this.locations.sort((a,b) => a.name.localeCompare(b.name)) : this.locations.sort((a,b) => b.cellConcentration - a.cellConcentration );
    }
  }

  toggleChecked(): void{
    this.show_checked = !this.show_checked;
    this.filterLocations();
  }

  filterLocations(): void {
    if(this.show_checked){
      this.sorted_locations = this.sorted_locations.filter(a => {return a.marked == true});
    }
    else{
      this.sorted_locations = (this.selected_value.localeCompare("name") == 0) ? this.locations.sort((a,b) => a.name.localeCompare(b.name)) : this.locations.sort((a,b) => b.cellConcentration - a.cellConcentration );
    }
  }

  hasLocations(): boolean {
    if (this.locations.length > 0){
      return true;
    }
    else {
      return false;
    }
  }

  getPercentage(l: Location) {
    return this.locationService.getPercentage(l);
  }

  getColor(l: Location, delta: boolean){
    return this.locationService.getColor(l, delta);
  }

  getArrow(l: Location){
    return this.locationService.getArrow(l);
  }

  formatNumber(n: number){
    return this.locationService.formatNumber(n);
  }

  locationSelect(event: any, l: Location) {
    this.router.navigate(['/locationdetails', {location: l.id, locations: this.sorted_locations.map((ln: Location) => ln.id)}]);
  }
}