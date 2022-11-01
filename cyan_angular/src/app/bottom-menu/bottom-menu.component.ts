import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import { LocationType } from '../models/location';
import { LocationService } from '../services/location.service';
import { AuthService } from '../services/auth.service';
import { BatchComponent } from '../batch/batch.component';
import { EnvService } from '../services/env.service';
import { MarkerMapComponent } from '../marker-map/marker-map.component';


@Component({
  selector: 'app-bottom-menu',
  templateUrl: './bottom-menu.component.html',
  styleUrls: ['./bottom-menu.component.css']
})
export class BottomMenuComponent implements OnInit {

  public data_type: LocationType;

  hideUpload: boolean = false;
  hideWaterbodyStats: boolean = false;

  configSetSub: Subscription;

  constructor(
    private locationService: LocationService,
    private authService: AuthService,
    private dialog: MatDialog,
    private envService: EnvService,
    private markerMap: MarkerMapComponent
  ) { }

  ngOnInit() {

    this.data_type = this.locationService.getDataType();

    this.configSetSub = this.envService.configSetObservable.subscribe(configSet => {
      if (configSet === true) {
        this.hideUpload = this.envService.config.disableUpload;
        this.hideWaterbodyStats = this.envService.config.disableWaterbodyStats;
      }
    });

  }

  ngOnDestroy() {
    if (this.configSetSub) {
      this.configSetSub.unsubscribe();
    }
  }

  dataTypeClick(type: number): void {
    console.log("Data type click: ", type)
    this.data_type = type;
    this.locationService.setDataType(type);
    let dataBool = type === 2 ? true : false;
    this.markerMap.getMostCurrentAvailableDate(dataBool);
  }

  reloadClick(): void {
    this.locationService.refreshData();
  }

  openCsvDialog(): void {
    /*
    Opens dialog for uploading CSV of locations for
    getting cyano data.
    */
    if (!this.authService.checkUserAuthentication()) { return; }
    const dialogRef = this.dialog.open(BatchComponent, {
      maxWidth: '100%',
      panelClass: 'csv-dialog'
    });
  }

}
