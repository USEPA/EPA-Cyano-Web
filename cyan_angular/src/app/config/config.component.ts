import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Options, ChangeContext } from 'ng5-slider';

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

  constructor(
    private userService: UserService,
    private locationService: LocationService,
    private router: Router) {
  }

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
  }

  saveConfig() {
    // save settings
    let self = this;
    this.userService.updateUserSettings(this.user_settings).subscribe({
      next: () => {
        self.userService.currentAccount.settings = Object.assign({}, self.user_settings);
        // refresh marker colors
        this.locationService.updateMarkers();
        self.exitConfig();
      },
      error: error => {
        console.error('Error saving user settings', error);
      }
    });
  }

  exitConfig() {
    this.router.navigate(['']);
  }
}
