import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { LocationType } from '../models/location';
import { LocationService } from '../services/location.service';
import { AuthService } from '../services/auth.service';
import { BatchComponent } from '../batch/batch.component';


@Component({
  selector: 'app-bottom-menu',
  templateUrl: './bottom-menu.component.html',
  styleUrls: ['./bottom-menu.component.css']
})
export class BottomMenuComponent implements OnInit {

  public data_type: LocationType;

  constructor(
    private locationService: LocationService,
    private authService: AuthService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.data_type = this.locationService.getDataType();
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
      maxWidth: '100%',
      // data: {
      //   comment: comment
      // }
    });
  }

}
