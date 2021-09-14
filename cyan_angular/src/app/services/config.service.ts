import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { ConcentrationRanges } from '../test-data/test-levels';
import { DownloaderService } from './downloader.service';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  private cyan_levels = new ConcentrationRanges();
  modified_cyan_levels = new ConcentrationRanges();

  green: string = 'rgb(0, 128, 0)';
  yellow: string = 'rgb(200, 200, 0)';
  orange: string = 'rgb(255, 165, 0)';
  red: string = 'rgb(255, 0, 0)';

  darkGreen: string = 'rgb(0, 102, 0)';
  darkYellow: string = 'rgb(170, 173, 0)';
  darkOrange: string = 'rgb(223, 139, 0)';
  darkRed: string = 'rgb(221, 0, 0)';

  constructor() {}

  resetLevels(): void {
    this.modified_cyan_levels = this.cyan_levels;
  }

  getLevels(): Observable<ConcentrationRanges> {
    return of(this.modified_cyan_levels);
  }

  getStaticLevels(): ConcentrationRanges {
    return this.modified_cyan_levels;
  }

  changeLevels(low: number[], med: number[], hi: number[], vhi: number[]): void {
    if (low.length === 2 && med.length === 2 && hi.length === 2 && vhi.length === 1) {
      if (this.isLower(hi, vhi) && this.isLower(med, hi) && this.isLower(low, med)) {
        this.modified_cyan_levels.low = low;
        this.modified_cyan_levels.medium = med;
        this.modified_cyan_levels.high = hi;
        this.modified_cyan_levels.veryhigh = vhi;
      }
    }
  }

  getColorRgbValue(color: string) {
    if (color === 'green') {
      return this.green;
    }
    else if (color === 'yellow') {
      return this.yellow;
    }
    else if (color === 'orange') {
      return this.orange;
    }
    else if (color === 'red') {
      return this.red;
    }
  }

  private isLower(f: number[], s: number[]): boolean {
    let f_ = f.sort();
    let s_ = s.sort();
    if (f_[1] > s_[0]) {
      return false;
    } else {
      return true;
    }
  }
}
