import { Component, OnInit, Input, SimpleChange } from "@angular/core";
import { SafeHtml, DomSanitizer } from "@angular/platform-browser";
import { LocationService } from "../services/location.service";
import { Location } from "../models/location";
import { ConfigService } from '../services/config.service';

@Component({
  selector: "app-meter",
  templateUrl: "./meter.component.html",
  styleUrls: ["./meter.component.css"],
})
export class MeterComponent implements OnInit {
  @Input() location: Location;
  @Input() cells: number;

  svg: SafeHtml;
  concentration: SafeHtml;

  meterSize = 80;
  meterRadius = this.meterSize / 2;
  meterWidth = 6;

  meterColor = "lightgray";
  meterCenterColor = "white";

  constructor(
    private sanitizer: DomSanitizer,
    private locationService: LocationService,
    private configService: ConfigService
  ) {}

  ngOnInit() {
    this.svg = this.setMeter(
      this.locationService.getPercentage2(this.location)
    );
    this.concentration = this.setConcentration(
      this.location.cellConcentration,
      this.configService.getColorRgbValue(this.locationService.getColor(this.location, false))
    );
  }
  
  ngOnChanges(changes: { [property: string]: SimpleChange }){
    let change: SimpleChange = changes['location'] ? changes['location'] : changes['cells'];
    console.log(change);

    this.svg = this.setMeter(
      this.locationService.getPercentage2(this.location)
    );
    this.concentration = this.setConcentration(
      this.location.cellConcentration,
      this.configService.getColorRgbValue(this.locationService.getColor(this.location, false))
    );
 }

  setMeter(percentage): SafeHtml {
    let meter: string;
    let a = (percentage / 100) * 360;
    if (a > 360) a = 360;
    if (a <= 1) {
      // score is below minimun, just draw two circles
      meter = `
      <svg
      id="meter"
      width="${this.meterSize}"
      height="${this.meterSize}"
      style="transform: rotate(-0.25turn);">
        <circle 
          cx="${this.meterRadius}" 
          cy="${this.meterRadius}" 
          r="${this.meterRadius}" 
          fill="${this.meterColor}" />
        <circle 
          cx="${this.meterRadius}" 
          cy="${this.meterRadius}" 
          r="${this.meterRadius - this.meterWidth}" 
          fill="${this.meterCenterColor}" />
      </svg>`;
    } else {
      // flip angle so guage (arc) increments from the correct direction
      let angle = 360 - a;
      // convert angle to radians
      let radians = (angle / 180) * Math.PI;
      // polar to cartesian transformation
      let endX = this.meterRadius + this.meterRadius * Math.cos(radians);
      let endY = this.meterRadius - this.meterRadius * Math.sin(radians);
      // set arc to be drawn correctly
      let largeArcFlag = angle > 180 ? 1 : 0;
      // define svg arc path and center circle
      meter = `
      <svg
      id="meter"
      width="${this.meterSize}"
      height="${this.meterSize}"
      style="transform: rotate(-0.25turn);">
        <path d="
          M ${this.meterSize} ${this.meterRadius} 
          A ${this.meterRadius} ${
        this.meterRadius
      } 0 ${largeArcFlag} 0 ${endX} ${endY} 
          L ${this.meterRadius} ${this.meterRadius}" 
          stroke="${this.meterColor}" 
          fill="${this.meterColor}" 
          stroke-width="1" />
        <circle 
          cx="${this.meterRadius}" 
          cy="${this.meterRadius}" 
          r="${this.meterRadius - this.meterWidth}" 
          fill="${this.meterCenterColor}" />
      </svg>`;
    }
    return this.sanitizer.bypassSecurityTrustHtml(meter);
  }

  getPercentage2(l: Location) {
    return this.locationService.getPercentage2(l);
  }

  setConcentration(concentration, color): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<div style="color: ${color};">${concentration}</div>`
    );
  }

  formatNumber(n: number) {
    return this.locationService.formatNumber(n);
  }
}
