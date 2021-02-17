import { Component, OnInit, Inject, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Options, ChangeContext } from 'ng5-slider';

// import { DialogComponent } from '../shared/dialog/dialog.component';
import { UserService } from '../services/user.service';
import { LocationService } from '../services/location.service';
import {UserSettings} from "../models/settings";

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.css']
})
export class ConfigComponent implements OnInit {
  private SLIDER_STEP = 1;
  private LEVEL_MAX = 1000000;
  private ALERT_MAX = 5000000;

  user_settings: UserSettings;
  user_inputs: UserSettings;

  slider_options: Options = {
    hideLimitLabels: true,
    hidePointerLabels: true,
    noSwitching: true,
    floor: 0,
    ceil: this.LEVEL_MAX,
    step: this.SLIDER_STEP,
  };

  slider_options_end: Options = {
    hideLimitLabels: true,
    hidePointerLabels: true,
    noSwitching: true,
    floor: 10000,
    ceil: this.LEVEL_MAX,
    step: this.SLIDER_STEP,
    showSelectionBarEnd: true
  };

  slider_options_alert: Options = {
    hideLimitLabels: true,
    hidePointerLabels: true,
    noSwitching: true,
    floor: 0,
    ceil: this.ALERT_MAX,
    step: this.SLIDER_STEP,
    showSelectionBarEnd: true
  };

  settingChange: boolean = false;
  isSaved: boolean = false;

  constructor(
    private userService: UserService,
    private locationService: LocationService,
    private router: Router,
    private saveDialog: MatDialog
  ) { }

  ngOnInit() {
    this.getRanges();
  }

  getRanges(): void {
    this.user_settings = Object.assign({}, this.userService.currentAccount.settings);
    this.user_inputs = Object.assign({}, this.userService.currentAccount.settings);
  }

  validateInputValue(c: ChangeContext): void {
    if (this.user_inputs.level_high > this.LEVEL_MAX) {
      this.user_inputs.level_high = this.LEVEL_MAX;
    }
    if (this.user_inputs.level_medium >= this.user_inputs.level_high) {
      this.user_inputs.level_medium = this.user_inputs.level_high - this.SLIDER_STEP;
    }
    if (this.user_inputs.level_low >= this.user_inputs.level_medium) {
      this.user_inputs.level_low = this.user_inputs.level_medium - this.SLIDER_STEP;
    }

    if (this.user_inputs.alert_value > this.ALERT_MAX) {
      this.user_inputs.alert_value = this.ALERT_MAX;
    }

    // sync user input values to update slider
    this.user_settings = Object.assign({}, this.user_inputs);

    this.settingChange = true;
  }

  validateValue(c: ChangeContext, slider: any): void {
    switch (slider) {
      case 'low':
        if (this.user_settings.level_low >= this.user_settings.level_medium) {
          this.user_settings.level_low = this.user_settings.level_medium - this.SLIDER_STEP;
        }
        break;
      case 'med':
        if (this.user_settings.level_low >= this.user_settings.level_medium) {
          this.user_settings.level_low = this.user_settings.level_medium - this.SLIDER_STEP;
        }
        if (this.user_settings.level_medium >= this.user_settings.level_high) {
          this.user_settings.level_medium = this.user_settings.level_high - this.SLIDER_STEP;
        }
        break;
      case 'hi':
        if (this.user_settings.level_medium >= this.user_settings.level_high) {
          this.user_settings.level_medium = this.user_settings.level_high - this.SLIDER_STEP;
        }
        break;
      case 'vhi':
        if (this.user_settings.level_medium >= this.user_settings.level_high) {
          this.user_settings.level_medium = this.user_settings.level_high - this.SLIDER_STEP;
        }
        break;
      default:
        break;
    }

    // sync to update the input fields
    this.user_inputs = Object.assign({}, this.user_settings);

    this.settingChange = true;
  }

  saveConfig() {
    // save settings
    let self = this;
    this.userService.updateUserSettings(this.user_settings).subscribe({
      next: () => {
        self.userService.currentAccount.settings = Object.assign({}, self.user_settings);
        // refresh marker colors
        this.locationService.updateMarkers();
        this.isSaved = true;
        self.exitConfig();
      },
      error: error => {
        console.error('Error saving user settings', error);
      }
    });
  }

  exitConfig() {
    if (this.isSaved === false && this.settingChange === true) {
      // Asks if user wants to save before closing:
      this.displayMessage('Save before closing?')
    }
    this.router.navigate(['']);
  }

  displayMessage(message: string): void {
    const dialogRef = this.saveDialog.open(SaveDialogComponent, {
      data: {
        dialogMessage: message
      }
    });
    const sub = dialogRef.componentInstance.saveEmitter.subscribe((save) => {
      if (save === true) {
        this.saveConfig();
      }
      else {
        this.router.navigate(['']);
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      sub.unsubscribe();
    });
  }

}

@Component({
  template: `
  <br>
  <div class="center-wrapper">
    <h6 class="center-item">{{dialogMessage}}</h6>
    <br><br>
    <button class="center-item" mat-raised-button color="primary" (click)=exit(true)>Yes</button>
    <button class="center-item" mat-raised-button color="primary" (click)=exit(false)>No</button>
  </div>
  <br>
  `,
  styles: [`
  .center-wrapper {
    text-align: center;
  }
  .center-item {
    display: inline-block;
    margin: 0 8px 0 8px;
  }
  `]
})
export class SaveDialogComponent {
  /*
  Dialog for saving config if exited without
  saving.
  */

  dialogMessage: string = "";
  saveEmitter: EventEmitter<boolean> = new EventEmitter();

  constructor(
    public dialogRef: MatDialogRef<SaveDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
    this.dialogMessage = this.data.dialogMessage;
  }

  exit(save: boolean): void {
    this.saveEmitter.emit(save);
    this.dialogRef.close();
  }

}
