import { Component, OnInit, Inject, Input } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field'
import { latLng, latLngBounds, tileLayer, marker, icon, Map, Marker, ImageOverlay } from 'leaflet';
import { ChartDataSets, ChartOptions, ChartType, ChartColor } from 'chart.js';
import { Label } from 'ng2-charts';

import {
  WaterBody,
  WaterBodyStats,
  WaterBodyProperties,
  WaterBodyDataByRange,
  RangeItem
} from '../models/waterbody';
import { DownloaderService } from '../services/downloader.service';
import { AuthService } from '../services/auth.service';
import { CyanMap } from '../utils/cyan-map';
import { DialogComponent } from '../shared/dialog/dialog.component';
import { LoaderService } from '../services/loader.service';
import { MapService } from '../services/map.service';
import { UserService } from '../services/user.service';
import { ConfigService } from '../services/config.service';


let dataByRange: WaterBodyDataByRange;
let chartLabels: string[] = ['low', 'medium', 'high', 'veryHigh'];


@Component({
  selector: 'app-waterbody-stats-details',
  templateUrl: './waterbody-stats-details.component.html',
  styleUrls: ['./waterbody-stats.component.css']
})
export class WaterBodyStatsDialog {
  /*
  Dialog for viewing waterbody stats.
  */

  selectedWaterbody: WaterBody = null;
  waterbodyData: any = {
    'daily': {},
    'weekly': {}
  };

  dataTypeRequestMap: any = {
    'daily': 'True',
    'weekly': 'False'
  }

  wbStats: WaterBodyStats = new WaterBodyStats();
  wbProps: WaterBodyProperties = new WaterBodyProperties();
  rangeStats: RangeItem = new RangeItem();

  minDate: Date = new Date();
  maxDate: Date = new Date();
  startDate: Date = new Date();
  endDate: Date = new Date();

  selectedDate: string = '';  // dates selection element
  selectedDataType: string = '';  // daily or weekly selection element
  selectedDates: Array<string> = [];  // array of checked dates for WB stats calculations
  selectedRange: string = 'low';  // selected range for stats (e.g., low, medium, high, veryHigh)

  calculatingStats: boolean = false;
  plotStats: boolean = false;

  // Variables for chart
  // ++++++++++++++++++++++++++
  public chartLabels: Label[] = ['low', 'medium', 'high', 'veryHigh'];
  @Input() chartData: ChartDataSets[] = [
    {
      data: [],
      label: ''
    }
  ];
  public chartHistoLabels: Label[] = [];  // TODO: define dynamically
  @Input() chartHistoData: ChartDataSets[] = [
    {
      data: [],
      label: ''
    }
  ];
  public chartOptions: ChartOptions = {
    responsive: true,
    legend: {
      display: false
    }
  };
  public chartColors: Array<any> = [
    {
      backgroundColor: [
        this.configService.green,
        this.configService.yellow,
        this.configService.orange,
        this.configService.red
      ]
    }
  ];
  public chartLegend: boolean = true;
  public chartType: ChartType = 'bar';
  // ++++++++++++++++++++++++++

  constructor(
    public dialogRef: MatDialogRef<DialogComponent>,
    private authService: AuthService,
    private downloader: DownloaderService,
    private loaderService: LoaderService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: DialogComponent,
    private mapService: MapService,
    private userService: UserService,
    private configService: ConfigService
  ) { }

  ngOnInit() {
    this.selectedWaterbody = this.data.selectedWaterbody;
    this.getWaterbodyData('daily');
    this.getWaterbodyData('weekly');
    this.getWaterbodyProperties();
  }

  exit(): void {
    this.dialogRef.close();
  }

  getWaterbodyData(dataType: string = 'daily') {
    /*
    Makes request to get selected waterbody data.
    */
    this.downloader.getWaterbodyData(this.selectedWaterbody.objectid, this.dataTypeRequestMap[dataType]).subscribe(result => {
      this.waterbodyData[dataType]['daily'] = result['daily'];
      this.waterbodyData[dataType]['data'] = result['data'];
    });
  }

  getWaterbodyProperties() {
    /*
    Gets waterbody properties.
    */
    this.downloader.getWaterbodyProperties(this.selectedWaterbody.objectid).subscribe(result => {
      this.createWaterbodyProperties(result);
    });
  }

  calculateWaterbodyStats(dayOfYear: string = null) {
    /*
    Calculates min/max, mean, medium, mode, std dev for cyano data
    based on dayOfYear (ex: "2020 1").
    */
    if (this.waterbodyData[this.selectedDataType] == null) {
      this.dialog.handleError('No ' + this.selectedDataType + 'waterbody data');
    }

    let dates: Array<string> = Object.keys(this.waterbodyData[this.selectedDataType]['data']);
    let dateArray = (dayOfYear ?? dates[0]).split(' ');
    let year = parseInt(dateArray[0]);
    let day = parseInt(dateArray[1]);
    let dataArray = this.waterbodyData[this.selectedDataType]['data'][dayOfYear ?? dates[0]];
    
    if (dates.length < 1) {
      this.dialog.handleError('No ' + this.selectedDataType + 'data found for waterbody');
    }

    let concentrationData = this.createCellArray(dataArray);  // array of concentration, count, index objects
    let concentrationArray = concentrationData.filter(obj => obj.count > 0).map(obj => obj.concentration);

    this.wbStats = new WaterBodyStats();
    this.wbStats.dates = dates;
    this.wbStats.date = this.getDateFromDayOfYear(year, day);
    this.wbStats.min = this.roundValue(Math.min(...concentrationArray));  // min concentration with at least one count
    this.wbStats.max = this.roundValue(Math.max(...concentrationArray));  // max concentration with at least one count
    this.wbStats.average = this.roundValue(this.calculateAverage(concentrationData));
    this.wbStats.stddev = this.roundValue(this.calculateStdDev(concentrationData));

    let chartData = this.createChartData(concentrationData);
    this.plotTotalCounts(chartData);
    this.plotHistoData(chartData);

    this.calculatingStats = true;
    this.plotStats = true;

  }

  calculateAverage(wbData): number {
    let sum = 0.0;
    wbData.forEach(datum => {
      sum += datum['concentration'];
    });
    return sum / wbData.length;
  }

  calculateStdDev(wbData): number {
    let average = this.calculateAverage(wbData);
    let diffSum = 0.0;
    wbData.forEach(datum => {
      diffSum += Math.pow(datum['concentration'] - average, 2)
    });
    return Math.sqrt(diffSum / wbData.length);
  }

  roundValue(value: number): number {
    /*
    Rounds value to two decimal places.
    */
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  getDayOfYear(d: Date) {
    /*
    Returns the day number out of the year (1..365/366) from a date (YYYY-MM-DD).
    */
    // let now = new Date();
    let start = new Date(d.getFullYear(), 0, 0);
    let diff = (d.getTime() - start.getTime()) + ((start.getTimezoneOffset() - d.getTimezoneOffset()) * 60 * 1000);
    let oneDay = 1000 * 60 * 60 * 24;
    let day = Math.floor(diff / oneDay);
    return day;
  }

  getDateFromDayOfYear(year: number, dayOfYear: number) {
    /*
    Returns date (YYYY-MM-DD) from a year and day of year.
    */
    let initDate: Date = new Date(year, 0);  // initializes date in year (year-01-01)
    let date: Date = new Date(initDate.setDate(dayOfYear));
    return date.toLocaleDateString();
  }

  updateDataType(dataTypeValue: string) {
    /*
    Selection change for data type.
    */
    // TODO: Does selectedDataType need explicitly set here? Seems
    // like it gets set in the template with data binding.
    this.selectedDataType = dataTypeValue;
    this.calculateWaterbodyStats();
  }

  updateHistoChart() {
    /*
    Selection change for range for histo chart.
    Updates plot with selected range.
    */
    this.plotHistoData(dataByRange);
  }

  public chartClick(event) {
    /*
    Total concentration count plot click event.
    Displays histo chart of clicked/selected range.
    */
    let clickedLabelIndex: number = event.active[0]['_index'];
    let clickedLabel: string = chartLabels[clickedLabelIndex].toString();
    this.selectedRange = clickedLabel;
    this.updateHistoChart();
  }

  public chartHover(event) {
    // console.log(event);
  }

  plotTotalCounts(chartData) {
    /*
    Plots total cell counts for each range.
    */
    let conData = [
      chartData.low.countSum,
      chartData.medium.countSum,
      chartData.high.countSum,
      chartData.veryHigh.countSum
    ];
    this.chartData[0].data = conData;
  }

  plotHistoData(chartData) {
    /*
    Plots histo of cell concentration for a given range.
    */
    this.chartHistoLabels = chartData[this.selectedRange].data.map(obj => obj.concentration);
    this.chartHistoData[0].data = chartData[this.selectedRange].data.map(obj => obj.count);
    this.chartHistoData[0].backgroundColor = this.getColor(this.selectedRange);
    this.rangeStats.min = chartData[this.selectedRange].min;
    this.rangeStats.max = chartData[this.selectedRange].max;
    this.rangeStats.average = chartData[this.selectedRange].average;
    this.rangeStats.stddev = chartData[this.selectedRange].stddev;
  }

  getColor(selectedRange: string): string {
    /*
    Returns name of color based on selected range.
    */
    if (selectedRange == 'low') {
      return this.configService.green;
    }
    else if (selectedRange == 'medium') {
      return this.configService.yellow;
    }
    else if (selectedRange == 'high') {
      return this.configService.orange;
    }
    else if (selectedRange == 'veryHigh') {
      return this.configService.red;
    }
    else {
      return 'black';
    }
  }

  createWaterbodyProperties(propResults) {
    /*
    Creates WaterBodyProperties objects from properties results.
    */
    if (!('properties' in propResults)) {
      this.dialog.handleError("No properties found for waterbody");
    }
    this.wbProps.areasqkm = this.roundValue(propResults['properties']['AREASQKM']);
    this.wbProps.elevation = this.roundValue(propResults['properties']['ELEVATION']);
    this.wbProps.fcode = propResults['properties']['FCODE'];
    this.wbProps.fdate = propResults['properties']['FDATE'];
    this.wbProps.ftype = propResults['properties']['FTYPE'];
    this.wbProps.globalid = propResults['properties']['GLOBALID'];
    this.wbProps.gnis_id = propResults['properties']['GNIS_ID'];
    this.wbProps.gnis_name = propResults['properties']['GNIS_NAME'];
    this.wbProps.objectid = propResults['properties']['OBJECTID'];
    this.wbProps.permanent_ = propResults['properties']['PERMANENT_'];
    this.wbProps.reachcode = propResults['properties']['REACHCODE'];
    this.wbProps.resolution = propResults['properties']['RESOLUTION'];
    this.wbProps.shape_area = this.roundValue(propResults['properties']['SHAPE_AREA']);
    this.wbProps.shape_leng = this.roundValue(propResults['properties']['SHAPE_LENG']);
    this.wbProps.state_abbr = propResults['properties']['STATE_ABBR'];
    this.wbProps.visibility = propResults['properties']['VISIBILITY'];
    this.wbProps.c_lat = propResults['properties']['c_lat'];
    this.wbProps.c_lng = propResults['properties']['c_lng'];
    this.wbProps.x_max = propResults['properties']['x_max'];
    this.wbProps.x_min = propResults['properties']['x_min'];
    this.wbProps.y_max = propResults['properties']['y_max'];
    this.wbProps.y_min = propResults['properties']['y_min'];
  }

  getDataArrayByDate(dayOfYear: string) {
    /*
    Gets array of WB data using day of year (e.g., "2020 299").
    */
    let dates: Array<string> = Object.keys(this.waterbodyData[this.selectedDataType]['data']);
    return (dayOfYear ?? dates[0]).split(' ');
  }

  calculateConcentration(index: number) {
    /*
    Calculates concentration (cells/ml) for each pixel value.
    */
    return Math.pow(10, 8) * Math.pow(10, (3.0 / 250) * index - 4.2);
  }

  createCellArray(wbResults: Array<number>) {
    /*
    Creates array of cell concentration (cells/mL) for each index.
      * wbResults - data array for a given date.
      * index 0 - 
    */
    let cellArray = [];
    wbResults.forEach((item, index) => {
      if (index == 0 || index == 254 || index == 255) {
        // Skips below detection, land, and no data
        return;
      }
      let dataObj = {
        index: index,
        count: item,
        concentration: this.roundValue(this.calculateConcentration(index))
      };
      cellArray.push(dataObj);
    });
    return cellArray;
  }

  createChartData(concentrationData) {
    /*
    Creates data structure for plotting bar chart
    of cell counts for user-defined ranges.
    */
    let userSettings = this.userService.getUserSettings();
    let totalCounts = 0.0;
    let totalConcentration = 0.0;

    dataByRange = new WaterBodyDataByRange();

    concentrationData.forEach(dataObj => {

      let concentration = dataObj.concentration;
      let counts = dataObj.count;

      totalCounts += counts;
      totalConcentration += concentration;

      if (concentration <= userSettings.level_low) {
        dataByRange.low.countSum += counts;
        dataByRange.low.data.push(dataObj);
      }
      else if (concentration > userSettings.level_low && concentration <= userSettings.level_medium) {
        dataByRange.medium.countSum += counts;
        dataByRange.medium.data.push(dataObj);
      }
      else if (concentration > userSettings.level_medium && concentration <= userSettings.level_high) {
        dataByRange.high.countSum += counts;
        dataByRange.high.data.push(dataObj);
      }
      else if (concentration > userSettings.level_high) {
        dataByRange.veryHigh.countSum += counts;
        dataByRange.veryHigh.data.push(dataObj);
      }
      else {
        this.dialog.handleError('Unknown error occurred');
      }

    });

    dataByRange.totalCounts = totalCounts;
    dataByRange.totalConcentration = totalConcentration;
    dataByRange.totalPixelArea = 0.09 * totalCounts;  // total pixels X pixel size (sq. km)
    dataByRange = this.calculateRangeArea(dataByRange);
    dataByRange = this.calculatePercentOfArea(dataByRange);
    dataByRange = this.calculatePercentOfTotalArea(dataByRange);
    dataByRange = this.calculateAverageForRange(dataByRange);
    dataByRange = this.calculateStddevForRange(dataByRange);
    dataByRange = this.calculateMinForRange(dataByRange);
    dataByRange = this.calculateMaxForRange(dataByRange);

    return dataByRange;
  }

  calculateRangeArea(dataByRange) {
    /*
    Calculates sq. area for each concentration range.
    Each pixel is 300m x 300m (0.09 sq. km).
    */
    for (let key in dataByRange) {
      if (!chartLabels.includes(key)) { continue; }
      dataByRange[key].areaPerRange = 0.09 * dataByRange[key].countSum;
    }
    return dataByRange;
  }

  calculatePercentOfArea(dataByRange) {
    /*
    Calcuates the percent area of each range compared to
    the total area (using pixel values, not actual/recorded WB area).
    */
    for (let key in dataByRange) {
      if (!chartLabels.includes(key)) { continue; }
      dataByRange[key].percentOfArea = this.roundValue(100.0 * (dataByRange[key].areaPerRange / dataByRange.totalPixelArea));
    }
    return dataByRange;
  }

  calculatePercentOfTotalArea(dataByRange) {
    /*
    Calculates percent of area for cyano counts relative
    to the area of the WB itself.
    */
    dataByRange.percentOfTotalArea = this.roundValue(100.0 * (dataByRange.totalPixelArea / this.wbProps.areasqkm));
    return dataByRange;
  }

  calculateAverageForRange(dataByRange) {
    /*
    Calculates average cyano levels per range.
    */
    for (let key in dataByRange) {
      if (!chartLabels.includes(key)) { continue; }
      dataByRange[key].average = this.roundValue(this.calculateAverage(dataByRange[key].data));
    }
    return dataByRange;
  }

  calculateStddevForRange(dataByRange) {
    /*
    Calculates Stddev cyano levels per range.
    */
    for (let key in dataByRange) {
      if (!chartLabels.includes(key)) { continue; }
      dataByRange[key].stddev = this.roundValue(this.calculateStdDev(dataByRange[key].data));
    }
    return dataByRange;
  }

  calculateMinForRange(dataByRange) {
    for (let key in dataByRange) {
      if (!chartLabels.includes(key)) { continue; }
      let filteredArray = dataByRange[key].data
        .filter(obj => obj.count > 0)
        .map(obj => obj.concentration);
      if (filteredArray.length < 1) {
        dataByRange[key].min = null;
      }
      else {
       dataByRange[key].min = Math.min(...filteredArray); 
      }
    }
    return dataByRange
  }

  calculateMaxForRange(dataByRange) {
    for (let key in dataByRange) {
      if (!chartLabels.includes(key)) { continue; }
      let filteredArray = dataByRange[key].data
        .filter(obj => obj.count > 0)
        .map(obj => obj.concentration);
      if (filteredArray.length < 1) {
        dataByRange[key].max = null;
      }
      else {
       dataByRange[key].max = Math.max(...filteredArray); 
      }
    }
    return dataByRange
  }

}