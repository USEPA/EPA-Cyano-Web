import { Component, OnInit, Input } from '@angular/core';
import { Subscription } from 'rxjs';

import { Location } from '../models/location';
import { LocationService } from '../services/location.service';
import { MapService } from '../services/map.service';

@Component({
  selector: 'app-map-popup',
  templateUrl: './map-popup.component.html',
  styleUrls: ['./map-popup.component.css']
})
export class MapPopupComponent implements OnInit {
  marked: string = 'Mark';
  @Input() location: Location;
  @Input() locationData: Location;

  locationSubscription: Subscription;

  constructor(private locationService: LocationService, private mapService: MapService) {}

  ngOnInit() {
    let self = this;
    if (!this.location) {
      let loc = this.locationService.getStaticLocations();
      this.locationData = loc[0];
      this.location = loc[0];
    } else {
      setTimeout(function() {
        self.getLocation();
        self.marked = self.location.marked ? 'Mark' : 'Unmark';
        self.locationService.downloadLocation(self.location, true);
      }, 300);
    }
  }

  ngOnDestroy() {
    this.location = null;
    this.locationData = null;
    if (this.locationSubscription) {
      this.locationSubscription.unsubscribe();
    }
  }

  getLocation(): void {
    let self = this;
    if (self.locationSubscription) {
      self.locationSubscription.unsubscribe();
    }
    self.locationSubscription = self.locationService.getLocationData().subscribe({
      next(locations) {
        self.locationData = locations.filter(l => {
          return l.id == self.location.id;
        })[0];
        if (self.locationData == null) {
          setTimeout(function() {
            self.getLocation();
          }, 100);
        } else {
          if (self.locationData.name.indexOf('Update') !== -1) {
            setTimeout(function() {
              self.getLocation();
            }, 100);
          } else {
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

  getColor(delta: boolean): string {
    return this.locationService.getColor(this.location, delta);
  }

  getArrow(): boolean {
    return this.locationService.getArrow(this.location);
  }

  formatNumber(n: number): string {
    return this.locationService.formatNumber(n);
  }

  updateName(e: any): void {
    let name = e.target.value;
    this.locationService.updateLocation(name, this.location);
  }

  saveNoteToLocation(ln: Location): void {
    console.log("Save note to location button hit.");
    let noteTextbox = <HTMLInputElement>document.getElementById('note-input');  // NOTE: casted as HTMLInputElement to make Typescript happy
    ln.notes.push(noteTextbox.value);  // any sort of parsing?
    this.locationService.updateLocation(ln.name, ln);
  }

  toggleMarkedLocation(ln: Location): void {
    let m = this.marked == 'Mark' ? false : true;
    this.locationService.setMarked(ln, m);

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
    this.locationService.addCompareLocation(ln);
  }

  deleteLocation(ln: Location): void {
    let self = this;
    this.mapService.deleteMarker(ln);
    setTimeout(function() {
      self.locationService.deleteLocation(ln);
    }, 1000);
  }
}
