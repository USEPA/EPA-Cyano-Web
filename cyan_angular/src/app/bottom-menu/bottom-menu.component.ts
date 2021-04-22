import { Component, OnInit, Inject } from '@angular/core';
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
  configSetSub: Subscription;

  constructor(
    private locationService: LocationService,
    private authService: AuthService,
    private dialog: MatDialog,
    private envService: EnvService
  ) { }

  ngOnInit() {
    this.data_type = this.locationService.getDataType();

    this.configSetSub = this.envService.configSetObservable.subscribe(configSet => {
      this.hideUpload = this.envService.config.disableUpload;
    });

  }

  ngOnDestroy() {
    if (this.configSetSub) {
      this.configSetSub.unsubscribe();
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
