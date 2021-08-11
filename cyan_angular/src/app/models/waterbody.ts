export class WaterBody {
	objectid: number;
	name: string;
	centroid_lat: number;
	centroid_lng: number;
	areasqkm: number;
	state_abbr: string;
}

export class WaterBodyData {
	objectid: number;
	daily: boolean;
	data: any;
}

export class WaterBodyStats {
	date: string;
	dates: Array<string>;
	min: number;
	max: number;
	average: number;
	stddev: number;
}

export class WaterBodyProperties {
	areasqkm: number;
	elevation: number;
	fcode: number;
	fdate: string;  //'2004/10/16 08:59:38.000'
	ftype: number;
	globalid: string;  //'{7152FDA6-4CB5-11E1-BCF4-0021280458E6}'
	gnis_id: string;  //'00894353'
	gnis_name: string;  //'Salt Lake'
	objectid: number;
	permanent_: string;  //'127559880'
	reachcode: string;  //'12050001000917'
	resolution: number;
	shape_area: number;
	shape_leng: number;
	state_abbr: string;  //'NM'
	visibility: number;
	c_lat: number;
	c_lng: number;
	x_max: number;
	x_min: number;
	y_max: number;
	y_min: number;
}

export class WaterBodyDataByRange {
  totalCounts: number = 0.0;
  totalPixelArea: number = 0.0;
  percentOfTotalArea: number = 0.0;
  totalConcentration: number = 0.0;
  low: RangeItem = new RangeItem();
  medium: RangeItem = new RangeItem();
  high: RangeItem = new RangeItem();
  veryHigh: RangeItem = new RangeItem();
}

export class RangeItem {
	countSum: number = 0.0;
  percentOfArea: number = 0.0;
  areaPerRange: number = 0.0;
  min: number = 0.0;
  max: number = 0.0;
  average: number = 0.0;
  stddev: number = 0.0;
  data: Array<number> = [];
}