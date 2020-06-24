import { Component, OnInit, Input } from "@angular/core";
import { SafeHtml, DomSanitizer } from "@angular/platform-browser";
import { LocationService } from "../services/location.service";

@Component({
  selector: "app-meter",
  templateUrl: "./meter.component.html",
  styleUrls: ["./meter.component.css"],
})
export class MeterComponent implements OnInit {
  @Input() meter_percentage: number;
  @Input() cellCon: number;
  @Input() cellConColor: string;

  svg: SafeHtml;

  meterSize = 80;
  meterRadius = this.meterSize / 2;
  meterWidth = 6;

  constructor(
    private sanitizer: DomSanitizer,
    private locationService: LocationService
  ) {}

  ngOnInit() {
    this.svg = this.setMeter(this.meter_percentage);
    console.log(this.cellCon + " | " + this.cellConColor);
  }

  setMeter(percentage): SafeHtml {
    let meter: string;
    let a = (percentage / 100) * 360;
    if (a > 360) a = 360;
    if (a <= 1) {
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
          fill="lightgray" />
        <circle 
          cx="${this.meterRadius}" 
          cy="${this.meterRadius}" 
          r="${this.meterRadius - this.meterWidth}" 
          fill="white" />
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
          stroke="lightgray" 
          fill="lightgray" 
          stroke-width="1" />
        <circle 
          cx="${this.meterRadius}" 
          cy="${this.meterRadius}" 
          r="${this.meterRadius - this.meterWidth}" 
          fill="white" />
      </svg>`;
    }
    return this.sanitizer.bypassSecurityTrustHtml(meter);
  }

  formatNumber(n: number) {
    return this.locationService.formatNumber(n);
  }
}
