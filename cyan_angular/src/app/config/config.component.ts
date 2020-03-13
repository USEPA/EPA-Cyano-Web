import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Options, ChangeContext } from 'ng5-slider';

import { UserService } from '../services/user.service';
import {UserSettings} from "../models/settings";

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.css']
})
export class ConfigComponent implements OnInit {
  private SLIDER_STEP = 10000;

  user_settings: UserSettings;

  slider_options: Options = {
    hideLimitLabels: true,
    hidePointerLabels: true,
    noSwitching: true,
    floor: 10000,
    ceil: 1000000,
    step: this.SLIDER_STEP,
  };

  slider_options_end: Options = {
    hideLimitLabels: true,
    hidePointerLabels: true,
    noSwitching: true,
    floor: 10000,
    ceil: 1000000,
    step: this.SLIDER_STEP,
    showSelectionBarEnd: true
  };

  slider_options_alert: Options = {
    hideLimitLabels: true,
    hidePointerLabels: true,
    noSwitching: true,
    floor: 0,
    ceil: 5000000,
    step: this.SLIDER_STEP,
    showSelectionBarEnd: true,
    readOnly: true
  };

  constructor(
    private userService: UserService,
    private router: Router) {
  }

  ngOnInit() {
    this.getRanges();
    this.onChangeReadOnly();
  }

  getRanges(): void {
    this.user_settings = this.userService.currentAccount.settings;
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
  }

  onChangeReadOnly(): void {
    this.slider_options_alert = Object.assign({}, this.slider_options_alert, { readOnly: !this.user_settings.enable_alert });
  }

  saveConfig() {
    // save settings
    this.userService.updateUserSettings(this.user_settings);
    this.exitConfig()
  }

  exitConfig() {
    this.router.navigate(['']);
  }
}
