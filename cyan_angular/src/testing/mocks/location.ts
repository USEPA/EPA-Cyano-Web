export class MockLocation {
  id: number = 1;
  name: string = "Test Location";
  type: number = 1;
  latitude: number = 38.5;
  longitude: number = -81.5;
  latitude_deg: number = 38;
  latitude_min: number = 30;
  latitude_sec: number = 0;
  latitude_dir: string = 'N';
  longitude_deg: number = 81;
  longitude_min: number = 30;
  longitude_sec: number = 0;
  longitude_dir: string = 'W';
  cellConcentration: number = 0;
  maxCellConcentration: number = 0;
  concentrationChange: number = 0;
  dataDate: string = "";
  changeDate: string = "";
  source: string = "";
  sourceFrequency: string = "";
  validCellCount: number = 0;
  notes: object[] = [];
  marked: false;
  compare: false;

  get hasData(): boolean {
    return !this.name.startsWith("Unknown Location");
  }
}