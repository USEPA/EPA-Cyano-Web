import { Injectable } from '@angular/core';
import { WaterBody } from './waterbody';

@Injectable()
export class Location {
  id: number;
  name: string;
  type: number;
  latitude: number;
  longitude: number;
  latitude_deg: number;
  latitude_min: number;
  latitude_sec: number;
  latitude_dir: string;
  longitude_deg: number;
  longitude_min: number;
  longitude_sec: number;
  longitude_dir: string;
  cellConcentration: number;
  maxCellConcentration: number;
  concentrationChange: number;
  dataDate: string;
  changeDate: string;
  source: string;
  sourceFrequency: string;
  validCellCount: number;
  notes: object[];
  marked: boolean;
  compare: boolean;

  waterbody: WaterBody;


  get hasData(): boolean {
    return !this.name.startsWith('Unknown Location');
  }

}

export enum LocationType {
  OLCI_WEEKLY = 1,
  OLCI_DAILY = 2,
}
