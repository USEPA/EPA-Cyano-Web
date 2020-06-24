import { Component, OnInit, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

import { Location } from '../models/location';
import { LocationService } from '../services/location.service';
import { MapService } from '../services/map.service';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { ConfigService } from '../services/config.service';


@Component({
  selector: 'app-map-popup',
  templateUrl: './map-popup.component.html',
  styleUrls: ['./map-popup.component.css']
})
export class MapPopupComponent implements OnInit {
  marked: string = 'Mark';
  @Input() location: Location;
  @Input() locationData: Location;
  compareSelected: boolean = false;
  compare_locations: Location[];

  locationSubscription: Subscription;
  locationCompareSub: Subscription;

  constructor(
    private locationService: LocationService,
    private mapService: MapService,
    private user: UserService,
    private datePipe: DatePipe,
    private router: Router,
    private authService: AuthService,
    private configService: ConfigService
  ) {}

  ngOnInit() {
    if (!this.authService.checkUserAuthentication()) { return; }

    let self = this;
    if (!this.location) {
      let loc = this.locationService.getStaticLocations();
      this.locationData = loc[0];
      this.location = loc[0];
    } else {
      self.getLocation();
      self.marked = self.location.marked ? 'Mark' : 'Unmark';
      self.locationService.downloadLocation(self.location);
    }

    this.compareSelected = this.locationInCompareArray(self.locationService.compare_locations);

    this.locationCompareSub = this.locationService.compare$.subscribe(locations => {
      this.compareSelected = this.locationInCompareArray(locations);
    });

  }

  ngOnDestroy() {
    this.location = null;
    this.locationData = null;
    if (this.locationSubscription) {
      this.locationSubscription.unsubscribe();
    }
    if (this.locationCompareSub) {
      this.locationCompareSub.unsubscribe();
    }
  }

  locationInCompareArray(compareLocations): boolean {
    if (this.location == null) { return; }
    let locIndex = compareLocations.map((item) => { return item.id; }).indexOf(this.location.id);
    if (locIndex > -1) {
      return true;
    }
    else {
      return false;
    }
  }

  getLocation(): void {
    let self = this;
    if (self.locationSubscription) {
      self.locationSubscription.unsubscribe();
    }
    self.locationSubscription = self.locationService.getLocationData().subscribe({
      next(locations) {
        if (!self.location) {
          self.locationData = null;
        } else {
          self.locationData = locations.filter(l => {
            return l.id == self.location.id;
          })[0];
        }
        if (self.locationData == null) {
          setTimeout(function() {
            self.getLocation();
          }, 300);
        }
        else {
          if (self.locationData.name.indexOf('Update') !== -1) {
            setTimeout(function() {
              self.getLocation();
            }, 300);
          }
          else {
            self.location = self.locationData;
          }
        }
      },
      error(msg) {
        // console.log(msg);
      },
      complete() {
        // console.log("Completed request for location data.");
      }
    });
  }

  getPercentage(): any {
    return this.locationService.getPercentage(this.location);
  }

  getPercentage2(l: Location) {
    return this.locationService.getPercentage2(l);
  }

  getColor(delta: boolean): string {
    let color = this.locationService.getColor(this.location, delta);  // gets color based on user's settings
    return this.configService.getColorRgbValue(color);
  }

  getArrow(): boolean {
    return this.locationService.getArrow(this.location);
  }

  getArrowColor(l: Location, delta: boolean) {
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

  formatNumber(n: number): string {
    return this.locationService.formatNumber(n);
  }

  updateName(e: any): void {
    if (!this.authService.checkUserAuthentication()) { return; }
    let name = e.target.value;
    this.locationService.updateLocation(name, this.location);
  }

  saveNoteToLocation(ln: Location): void {
    if (!this.authService.checkUserAuthentication()) { return; }
    let noteTextbox = <HTMLInputElement>document.getElementById('note-input');  // NOTE: casted as HTMLInputElement to make Typescript happy
    let dateTime = this.datePipe.transform(new Date(), 'yyyy-MM-dd hh:mm:ss');
    let noteObj = {
      timestamp: dateTime,
      note: noteTextbox.value
    };
    this.locationService.getLocations('').subscribe(locations => {
      let location = locations.find(locObj => locObj.id == ln.id);  // matches locId to locations location with same id
      let notes = location.notes;
      let locNotes = [];
      if (notes.length > 0) {
        locNotes = location.notes;
      }
      locNotes.push(noteObj);
      location.notes = locNotes;
      this.locationService.updateLocation(location.name, location);
    });
    noteTextbox.value = "";
  }

  toggleMarkedLocation(ln: Location): void {
    if (!this.authService.checkUserAuthentication()) { return; }
    let m = ln.marked;
    ln.marked = !m;
    // Change mark button label
    let label = document.getElementById('marked-label');
    label.innerHTML = this.marked;
    // Change mark button icon
    let icon = document.getElementById('marked-icon');
    let iconClasses = icon.classList;
    if (iconClasses.contains('mark')) {
      icon.className = 'unmark';
    } else {
      icon.className = 'mark';
    }
    this.marked = m ? 'Unmark' : 'Mark';
    this.mapService.updateMarker(ln);
    this.locationService.updateLocation(ln.name, ln);
  }

  compareLocation(ln: Location): void {
    if (!this.authService.checkUserAuthentication()) { return; }
    this.compareSelected = !this.compareSelected;
    if (this.compareSelected) {
      this.locationService.addCompareLocation(ln);
    }
    else{
       this.locationService.deleteCompareLocation(ln);  // removes from compare array if it exists
    }
  }

  viewLatestImage(ln: Location): void {
    if (!this.authService.checkUserAuthentication()) { return; }
    this.router.navigate(['/latestimage', { location: JSON.stringify(ln) }]);
  }

  deleteLocation(ln: Location): void {
    if (!this.authService.checkUserAuthentication()) { return; }
    this.mapService.deleteMarker(ln);
    this.locationService.deleteLocation(ln);
  }

}
