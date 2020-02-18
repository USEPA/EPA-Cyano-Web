import { Component, OnInit, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

import { Location } from '../models/location';
import { LocationService } from '../services/location.service';
import { MapService } from '../services/map.service';
import { UserService } from '../services/user.service';

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

  constructor(
    private locationService: LocationService,
    private mapService: MapService,
    private user: UserService,
    private datePipe: DatePipe,
    private router: Router
  ) {}

  ngOnInit() {
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
    let m = ln.marked;
    this.locationService.setMarked(ln, !m);
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

  viewLatestImage(ln: Location): void {
    this.router.navigate(['/latestimage', { location: JSON.stringify(ln) }]);
  }

  deleteLocation(ln: Location): void {
    this.mapService.deleteMarker(ln);
    this.locationService.deleteLocation(ln);
  }
}
