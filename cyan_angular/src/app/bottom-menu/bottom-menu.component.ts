import { Component, OnInit, Inject, Input } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import { LocationType } from '../models/location';
import { LocationService } from '../services/location.service';
import { AuthService } from '../services/auth.service';
import { BatchComponent } from '../batch/batch.component';
import { EnvService } from '../services/env.service';


@Component({
  selector: 'app-bottom-menu',
  templateUrl: './bottom-menu.component.html',
  styleUrls: ['./bottom-menu.component.css']
})
export class BottomMenuComponent implements OnInit {

  public data_type: LocationType;

  hideUpload: boolean = false;
  envNameSub: Subscription;

  constructor(
    private locationService: LocationService,
    private authService: AuthService,
    private dialog: MatDialog,
    private envService: EnvService
  ) { }

  ngOnInit() {
    this.data_type = this.locationService.getDataType();

    // Hides upload feature based on environment:
    this.envNameSub = this.envService.envNameObserverable.subscribe(hideFeature => {
      this.hideUpload = hideFeature;
    });

  }

  ngOnDestroy() {
    if (this.envNameSub) {
      this.envNameSub.unsubscribe();
    }
  }

  dataTypeClick(type: number): void {
    this.data_type = type;
    this.locationService.setDataType(type);
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
      // panelClass: 'view-comment-dialog',
      // TODO: Use class to account for various device sizes
      width: '60%',
      maxWidth: '75%',
      height: '75%'
    });
  }

}
