import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Options, ChangeContext } from 'ng5-slider';

import { ConfigService } from '../config.service';
import { ConcentrationRanges } from '../test-levels';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.css']
})
export class ConfigComponent implements OnInit {

  cyan_levels: ConcentrationRanges;

  low_level_0: number;
  low_level_1: number;
  med_level_0: number;
  med_level_1: number;
  hi_level_0: number;
  hi_level_1: number;
  vhi_level: number;

  no_alert: boolean = false;
  alert_level: number = 1000000;

  slider_options: Options = {
    hideLimitLabels: true,
    hidePointerLabels: true,
    noSwitching: true,
    floor: 10000,
    ceil: 1000000
  };

  slider_options_end: Options = {
    hideLimitLabels: true,
    hidePointerLabels: true,
    noSwitching: true,
    floor: 10000,
    ceil: 1000000,
    showSelectionBarEnd: true
  }

  slider_options_alert: Options = {
    hideLimitLabels: true,
    hidePointerLabels: true,
    noSwitching: true,
    floor: 0,
    ceil: 5000000,
    showSelectionBarEnd: true,
    readOnly: true
  }

  constructor(private configService: ConfigService, private router: Router) { }

  ngOnInit() {
    this.getRanges();
    this.setRanges();
  }

  setRanges(): void {
    this.low_level_0 = this.cyan_levels.low[0];
    this.low_level_1 = this.cyan_levels.low[1];
    this.med_level_0 = this.cyan_levels.medium[0];
    this.med_level_1 = this.cyan_levels.medium[1];
    this.hi_level_0 = this.cyan_levels.high[0];
    this.hi_level_1 = this.cyan_levels.high[1];
    this.vhi_level = this.cyan_levels.veryhigh[0];
  }

  getRanges(): void {
    this.configService.getLevels().subscribe(levels => this.cyan_levels = levels);
  }

  validateValue(c: ChangeContext, slider: any): void {
    switch(slider){
      case "low":
        if (this.low_level_0 >= this.low_level_1){
          this.low_level_0 = this.low_level_1 - 1;
          this.med_level_0 = this.low_level_1 + 1;
        }
        else if(this.low_level_1 >= this.med_level_1 - 1){
          this.med_level_0 = this.med_level_1 - 1;
          this.low_level_1 = this.med_level_0 - 1;
        }
        else{
          this.med_level_0 = this.low_level_1 + 1;
        }
        break;
      case "med":
        if (this.med_level_0 <= this.low_level_0){
          this.med_level_0 = this.low_level_1 + 1;
        }
        else if(this.med_level_0 >= this.med_level_1){

          this.med_level_0 = this.low_level_1 + 1;
          this.med_level_1 = this.med_level_0 + 1;
          this.hi_level_0 = this.med_level_1 + 1;
        }
        else if(this.med_level_1 >= this.hi_level_1 - 1){
          this.hi_level_0 = this.hi_level_1 - 1;
          this.med_level_1 = this.hi_level_0 - 1;
        }
        else{
          this.low_level_1 = this.med_level_0 - 1;
          this.hi_level_0 = this.med_level_1 + 1;
        }
        break;
      case "hi":
        if (this.hi_level_0 <= this.med_level_0){
          this.med_level_1 = this.med_level_0 + 1;
          this.hi_level_0 = this.med_level_1 + 1;
        }
        else if(this.hi_level_0 >= this.hi_level_1){
          this.hi_level_1 = this.hi_level_0 + 1;
          this.med_level_1 = this.hi_level_0 - 1;
        }
        else{
          this.med_level_1 = this.hi_level_0 - 1;
        }
        this.vhi_level = this.hi_level_1;
        break;
      case "vhi":
        if (this.vhi_level <= this.hi_level_0){
          this.hi_level_1 = this.hi_level_0 + 1;
          this.vhi_level = this.hi_level_1 + 1;
        }
        else{
          this.hi_level_1 = this.vhi_level;
        }
        break;
      default:
        break;
    }
    this.updateRanges();
  }

  updateRanges(): void {
    let low = [this.low_level_0, this.low_level_1];
    let medium = [this.med_level_0, this.med_level_1];
    let high = [this.hi_level_0, this.hi_level_1];
    let veryhigh = [this.vhi_level];
    this.configService.changeLevels(low, medium, high, veryhigh);
  }

  resetRanges(): void {
    this.configService.resetLevels();
  }

  onChangeReadOnly(): void {
    this.slider_options_alert = Object.assign({}, this.slider_options_alert, {readOnly: !this.no_alert});
  }

  exitConfig(){
    this.router.navigate(['']);
  }
}
