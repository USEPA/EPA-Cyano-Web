import { Component, OnInit, Inject, Input, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field'
import { latLng, latLngBounds, tileLayer, marker, icon, Map, Marker, geoJSON, imageOverlay, ImageOverlay } from 'leaflet';
import { ChartDataSets, ChartOptions, ChartType, ChartColor } from 'chart.js';
import { Label, BaseChartDirective } from 'ng2-charts';
import { ActivatedRoute, Router } from '@angular/router';

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
import { LocationService } from '../services/location.service';
import { Calculations } from './calculations';
import { Charts } from './charts';



@Component({
  selector: 'app-waterbody-stats-details',
  templateUrl: './waterbody-stats-details.component.html',
  styleUrls: ['./waterbody-stats.component.css']
})
export class WaterBodyStatsDetails {
  /*
  Dialog for viewing waterbody stats.
  */
  selectedWaterbody: WaterBody = null;
  waterbodyData: any = {
    'daily': {},
    'weekly': {}
  };  // raw wb data from api

  dataTypeRequestMap: any = {
    'daily': 'True',
    'weekly': 'False'
  }

  wbStats: WaterBodyStats = new WaterBodyStats();
  wbProps: WaterBodyProperties = new WaterBodyProperties();
  rangeStats: RangeItem = new RangeItem();

  dataByRange: WaterBodyDataByRange = new WaterBodyDataByRange();

  selectedDate: string = '';  // dates selection element
  selectedAvailableDate: string = '';

  selectedDataType: string = '';  // daily or weekly selection element
  dataTypes: string[] = ['daily', 'weekly'];

  selectedRange: string = 'low';  // selected range for stats (e.g., low, medium, high, veryHigh)
  ranges: string[] = ['low', 'medium', 'high', 'veryHigh'];

  selectedDateRange: string = 'single';  // single, 7day, or 30day
  dateRanges: string[] = ['single', '7day', '30day'];
  datesWithinRange: string[] = [];

  plotTypes: string[] = ['Total Cell Counts', 'Percentage of Detected Area', 'Percentage of Total Area'];
  selectedPlotType: string = this.plotTypes[0];

  calculatingStats: boolean = false;
  plotStats: boolean = false;

  curatedData: any = {
    daily: {},
    weekly: {}
  };

  selectedData: any = {};  // selected date's data for plots
  selectedStats: any = {};  // selected date's stats

  slidershow: boolean = false;
  selectedDateIndex: number = 0;

  // Bar chart parameters:
  public chartLabels: Label[] = this.ranges;
  public chartLabels1: Label[] = this.ranges;
  public chartLabels2: Label[] = ['low', 'medium', 'high', 'veryHigh', 'no data'];
  @Input() chartData: ChartDataSets[] = this.charts.chartData;
  public chartOptions: ChartOptions = this.charts.chartOptions;
  public chartColors: Array<any> = this.charts.chartColors
  public chartLegend: boolean = this.charts.chartLegend;
  public chartType: ChartType = this.charts.chartType;

  @Input() pieChartData: ChartDataSets[] = this.charts.pieChartData;
  public pieChartOptions: ChartOptions = this.charts.pieChartOptions;
  public pieChartColors: Array<any> = this.charts.pieChartColors
  public pieChartLegend: boolean = this.charts.pieChartLegend;
  public pieChartType: ChartType = this.charts.pieChartType;

  // Stacked bar chart parameters:
  public stackedChartData: ChartDataSets[] = this.charts.stackedChartData;
  public stackedChartOptions: ChartOptions = this.charts.stackedChartOptions;
  public stackedChartColors: Array<any> = this.charts.stackedChartColors;
  public stackedChartType: ChartType = this.charts.stackedChartType;
  public stackedChartLabels: Label[] = this.charts.stackedChartLabels;

  showStacked: boolean = false;
  showPie: boolean = false;
  showBars: boolean = true;

  // Histo chart parameters:
  public histoChartLabels: Label[] = [];  // TODO: define dynamically
  @Input() histoChartData: ChartDataSets[] = [
    {
      data: [],
      label: ''
    }
  ];
  public histoChartType: ChartType = 'bar';

  // Line chart parameters:
  public lineChartData: ChartDataSets[] = this.charts.lineChartData;
  public lineChartOptions: ChartOptions = this.charts.lineChartOptions;
  public lineChartColors: Array<any> = this.charts.lineChartColors;
  public lineChartType: ChartType = this.charts.lineChartType;
  public lineChartLabels: Label[] = this.charts.lineChartLabels;

  wbLayer = null;
  wbImageLayer = null;

  requestsTracker: number = 0;
  totalRequests: number = 0;

  showLegend: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<DialogComponent>,
    private authService: AuthService,
    private downloader: DownloaderService,
    private loaderService: LoaderService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: DialogComponent,
    private mapService: MapService,
    private userService: UserService,
    private configService: ConfigService,
    private locationService: LocationService,
    private activatedRoute: ActivatedRoute,
    private cyanMap: CyanMap,
    private calcs: Calculations,
    private charts: Charts,
    private router: Router,
  ) { }

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      console.log("waterbody-stats-details ngOnInit() params: ")
      console.log(params);
      this.selectedWaterbody = JSON.parse(params.selectedWaterbody);
      this.loaderService.showProgressBar();
      this.loaderService.show();
      this.getWaterbodyData('daily');
      this.getWaterbodyData('weekly');
      this.getWaterbodyProperties();
      this.getWaterbodyGeojson(this.selectedWaterbody);
    });
  }

  exit(): void {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.removeLayers();
  }

  getWaterbodyData(dataType: string = 'daily') {
    /*
    Makes request to get selected waterbody data.
    */
    this.incrementRequest();
    this.downloader.getWaterbodyData(this.selectedWaterbody.objectid, this.dataTypeRequestMap[dataType]).subscribe(result => {
      this.updateProgressBar();
      this.waterbodyData[dataType]['daily'] = result['daily'];
      this.waterbodyData[dataType]['data'] = result['data'];
      this.calculateAllWaterbodyStats(dataType);
    });
  }

  getWaterbodyProperties() {
    /*
    Gets waterbody properties.
    */
    this.incrementRequest();
    this.downloader.getWaterbodyProperties(this.selectedWaterbody.objectid).subscribe(result => {
      this.updateProgressBar();
      this.createWaterbodyProperties(result);
    });
  }

  getWaterbodyGeojson(wb: WaterBody): void {
    /*
    Makes request to cyan-waterbody to get
    geojson of selected waterbody, then adds
    it as a map layer.
    */
    this.removeLayers();
    this.incrementRequest();
    this.downloader.getWaterbodyGeometry(wb.objectid).subscribe(response => {
      this.updateProgressBar();
      let geojson = response['geojson'][0][0];  // TODO: Account for > 1 features
      this.wbLayer = geoJSON(geojson, {
        style: {
          fill: false,
          weight: 2
        },
        bubblingMouseEvents: false  // prevents wb shape click event from trigger location creation
      });
      this.cyanMap.map.addLayer(this.wbLayer);
    });
  }

  removeLayers(): void {
    /*
    Removes geoJSON layer from map.
    */
    if (this.wbLayer) {
      this.cyanMap.map.removeLayer(this.wbLayer);
    }
    if (this.wbImageLayer) {
      this.cyanMap.map.removeLayer(this.wbImageLayer);
    }
  }

  getWaterbodyImage(objectid: number, year: number, day: number): void {
    /*
    Adds waterbody pixel image as a map layer.
    */
    this.loaderService.show();
    this.downloader.getWaterbodyImage(objectid, year, day).subscribe(response => {
      if (this.wbImageLayer) {
        console.log("Removing image layer")
        this.cyanMap.map.removeLayer(this.wbImageLayer);
      }
      let imageBlob = response.body;
      let bbox = JSON.parse(response.headers.get('bbox'));
      this.addImageLayer(imageBlob, bbox);
      this.loaderService.hide();
    });
  }

  calculateAllWaterbodyStats(dataType: string) {
    /*
    Calculates all WB stats for all dates.
    */
    if (
      Object.keys(this.waterbodyData[dataType]).length <= 0 ||
      Object.keys(this.waterbodyData[dataType]['data']).length <= 0
    ) {
      this.dialog.handleError('No ' + this.selectedDataType + ' waterbody data currently available');
    }

    this.curatedData[dataType]['dates'] = Object.keys(this.waterbodyData[dataType]['data']);
    this.curatedData[dataType]['formattedDates'] = this.curatedData[dataType].dates.map(date => {
      return this.calcs.getDateFromDayOfYear(date);
    });

    console.log("calculateAllWaterbodyStats() called, available dates: ")
    console.log(this.waterbodyData[dataType]['data'])
    console.log(this.curatedData[dataType]['dates'])
    console.log(this.curatedData[dataType]['formattedDates'])

    if (this.curatedData[dataType]['dates'].length < 1) {
      this.dialog.handleError('No ' + this.selectedDataType + 'data found for waterbody');
    }

    this.curatedData[dataType].dates.forEach((date, index) => {
      this.curatedData[dataType][date] = {
        stats: null,  // waterbody stats
        data: null  // curated data for plots, divided by range
      };
      let dataArray = this.waterbodyData[dataType].data[date];
      let concentrationData = this.createCellArray(dataArray);  // array of concentration, count, index objects
      let concentrationArray = concentrationData.filter(obj => obj.count > 0).map(obj => obj.concentration);
      let wbStats = new WaterBodyStats();
      wbStats.date = this.calcs.getDateFromDayOfYear(date);
      wbStats.min = this.calcs.roundValue(Math.min(...concentrationArray));  // min concentration with at least one count
      wbStats.max = this.calcs.roundValue(Math.max(...concentrationArray));  // max concentration with at least one count
      wbStats.average = this.calcs.calculateAverage(concentrationData);
      wbStats.stddev = this.calcs.calculateStdDev(concentrationData);
      let chartData = this.createChartData(concentrationData);  // data by range for date
      this.curatedData[dataType][date].stats = wbStats;
      this.curatedData[dataType][date].data = chartData;
    });

  }

  calculateWaterbodyStats(formattedDate: string = null) {
    /*
    Calculates min/max, mean, medium, mode, std dev for cyano data
    based on dayOfYear (ex: "2020 1").
    */
    if (
      Object.keys(this.waterbodyData[this.selectedDataType]).length <= 0 ||
      Object.keys(this.waterbodyData[this.selectedDataType]['data']).length <= 0
    ) {
      this.dialog.handleError('No ' + this.selectedDataType + ' waterbody data currently available');
    }
    let dataObj = this.curatedData[this.selectedDataType];
    let index = dataObj.formattedDates.indexOf(formattedDate);
    let dateKey = dataObj.dates[index];
    let selectedData = dataObj[dateKey].data;
    let selectedStats = dataObj[dateKey].stats;
    let year = dateKey.split(' ')[0];  // e.g., "2021 03"
    let day = dateKey.split(' ')[1];
    if (dataObj.dates.length < 1) {
      this.dialog.handleError('No ' + this.selectedDataType + 'data found for waterbody');
    }
    this.getWaterbodyImage(this.wbProps.objectid, year, day);
    this.wbStats = new WaterBodyStats();
    this.wbStats.dates = dataObj.formattedDates;
    this.wbStats.date = formattedDate;
    this.wbStats.min = selectedStats.min;
    this.wbStats.max = selectedStats.max;
    this.wbStats.average = selectedStats.average;
    this.wbStats.stddev = selectedStats.stddev;
    this.selectedAvailableDate = this.wbStats.date;  // sets selectedDate
    this.handlePlot(selectedData);
    if (this.selectedDate == 'all') {
      this.plotLineData(dataObj.formattedDates);
    }
    else {
      this.plotHistoData(selectedData);
    }
    this.calculatingStats = true;  // displays stats for selected date
    this.plotStats = true;  // displays plot of cell counts
  }

  updateDataType(dataTypeValue: string) {
    /*
    Selection change for data type.
    */
    this.wbStats.dates = this.curatedData[dataTypeValue].formattedDates;  // sets dates based on selected data type (daily/weekly)

    if (!this.dataTypes.includes(dataTypeValue)) {
      this.dialog.handleError('Data type must be "daily" or "weekly"');
    } 
    else if(!this.selectedAvailableDate || !this.dateRanges.includes(this.selectedDateRange)) {
      return;
    }
    this.calculateWaterbodyStats(this.selectedAvailableDate);
  }

  updateDate(dateValue: string) {
    /*
    Selection change for available dates.
    */
    // TODO: Account for date range choice for plots.
    // this.calculateWaterbodyStats(dateValue);
    this.updateDateRange(this.selectedDateRange);  // TODO: refactor code from this func to its own func
  }

  updateDateRange(dateRangeValue: string) {
    /*
    Updates selected date range.
    */

    // TODO: Disable plot title toggle if multi day option

    if (
      !this.dataTypes.includes(this.selectedDataType) ||
      !this.dateRanges.includes(this.selectedDateRange)
    ) {
      this.dialog.handleError('Select a data type and/or date range first');
    }

    if (['7day', '30day'].includes(dateRangeValue)) {
      // Multi-day range
      this.selectedPlotType = this.plotTypes[0];  // sets title for stacked bars
      let range = parseInt(dateRangeValue.split('day')[0]);
      let d = new Date(this.selectedAvailableDate);
      let endDate = d.getTime();
      let startDate = new Date(this.selectedAvailableDate).setDate(d.getDate() - range);
      this.datesWithinRange = this.curatedData[this.selectedDataType].formattedDates.filter(date => {
        let d = new Date(date).getTime();
        if (d <= endDate && d > startDate) {
          return true;
        }
      });
      this.plotRangeOfTotalCounts(this.datesWithinRange);
      this.plotLineData(this.datesWithinRange);
    }
    else {
      // Single-day range
      // TODO: Plot classic bars and histo for selected available date.
      // TODO: Plot bars or pie based on selectedPlotType
      console.log("updateDateRange() single day range: " + this.selectedAvailableDate);
      this.datesWithinRange = [];
      this.calculateWaterbodyStats(this.selectedAvailableDate);
    }

  }

  updateHistoChart() {
    /*
    Selection change for range for histo chart.
    Updates plot with selected range.
    */
    if (!this.selectedAvailableDate) {
      this.dialog.handleError('No selected date.');
    }
    let date = this.calcs.getDayOfYear(this.selectedAvailableDate);
    this.plotHistoData(this.curatedData[this.selectedDataType][date].data);
  }

  handlePlot(chartData) {
    /*
    Handles total count/percent area/percent total area plotting
    based on selectedPlotType.
    */
    if (this.selectedPlotType == this.plotTypes[0]) {
      this.plotTotalCounts(chartData);
    }
    else if (this.selectedPlotType == this.plotTypes[1]) {
      this.plotPercentDetectedArea(chartData);
    }
    else if (this.selectedPlotType == this.plotTypes[2]) {
      this.plotPercentTotalArea(chartData);
    }
    else {
      this.selectedPlotType = this.plotTypes[0];
      this.plotTotalCounts(chartData);
    }
  }

  togglePlotType() {
    /*
    Toggles between plot types.
    */

    if (['7day', '30day'].includes(this.selectedDateRange)) {
      console.log("Skipping plot toggling for multi-day modes")
      return;
    }

    let dateIndex = this.curatedData[this.selectedDataType].formattedDates.indexOf(this.selectedAvailableDate);
    let date = this.calcs.getDayOfYear(this.selectedAvailableDate);
    let chartData = this.curatedData[this.selectedDataType][date].data;
    const plotIndex = this.plotTypes.indexOf(this.selectedPlotType);  // currently selected plot type
    let nextPlotType = this.plotTypes[plotIndex + 1];
    if (!nextPlotType || nextPlotType == this.plotTypes[0]) {
      // toggles to cell concentration
      this.plotTotalCounts(chartData);
    }
    else if (nextPlotType == this.plotTypes[1]) {
      // toggles to total percentage of detected area
      this.plotPercentDetectedArea(chartData);
    }
    else if (nextPlotType == this.plotTypes[2]) {
      // toggles to total percentage of total area
      this.plotPercentTotalArea(chartData);
    }
    else {
      // toggles to cell concentration
      this.plotTotalCounts(chartData);
    }
  }

  public chartClick(event) {
    /*
    Total concentration count plot click event.
    Displays histo chart of clicked/selected range.
    */
    let clickedLabelIndex: number = event.active[0]['_index'];
    let clickedLabel: string = this.chartLabels[clickedLabelIndex].toString();
    this.selectedRange = clickedLabel;
    this.updateHistoChart();
  }

  toggleLegend() {
    this.showLegend = !this.showLegend;
  }

  plotTotalCounts(chartData) {
    /*
    Plots total cell counts for each range.
    */
    this.chartData[0].data = [];
    this.chartLabels = this.chartLabels1;
    this.selectedPlotType = this.plotTypes[0];
    this.showStacked = false;
    this.showPie = false;
    this.showBars = true;
    let conData = [
      chartData.low.countSum,
      chartData.medium.countSum,
      chartData.high.countSum,
      chartData.veryHigh.countSum
    ];
    this.chartData[0].data = conData;
  }

  plotPercentDetectedArea(chartData) {
    /*
    Plots pie chart of percent area for each cyano range.
    */ 
    this.selectedPlotType = this.plotTypes[1];
    this.showStacked = false;
    this.showPie = true;
    this.showBars = false;
    this.chartLabels = this.chartLabels1;
    let percentAreaData = [
      chartData.low.percentOfArea,
      chartData.medium.percentOfArea,
      chartData.high.percentOfArea,
      chartData.veryHigh.percentOfArea
    ];
    this.pieChartData[0].data = percentAreaData;
  }

  plotPercentTotalArea(chartData) {
    /*
    Plots pie chart of percentage of total area for a given range.
    */
    this.selectedPlotType = this.plotTypes[2];
    this.showStacked = false;
    this.showPie = true;
    this.showBars = false;
    this.chartLabels = this.chartLabels2;
    let percentAreaData = [
      (chartData.low.percentOfArea * chartData.percentOfTotalArea) / 100.0,
      (chartData.medium.percentOfArea * chartData.percentOfTotalArea) / 100.0,
      (chartData.high.percentOfArea * chartData.percentOfTotalArea) / 100.0,
      (chartData.veryHigh.percentOfArea * chartData.percentOfTotalArea) / 100.0,
      100.0 - chartData.percentOfTotalArea
    ];
    this.pieChartData[0].data = percentAreaData;

    if (this.chartLabels.length > 4) {
      this.chartLabels.push('no data')
    }
  }

  plotRangeOfTotalCounts(dates: string[]) {
    /*
    Stacked bar chart of selected date range.
    */
    this.showStacked = true;
    this.showPie = false;
    this.showBars = false;
    this.selectedPlotType = this.plotTypes[0];

    this.stackedChartLabels = [];
    this.stackedChartData[0].data = [];
    this.stackedChartData[1].data = [];
    this.stackedChartData[2].data = [];
    this.stackedChartData[3].data = [];

    dates.forEach(date => {
      let dayOfYear = this.calcs.getDayOfYear(date);
      let dataObj = this.curatedData[this.selectedDataType][dayOfYear];
      this.stackedChartLabels.push(date);
      this.stackedChartData[0].data.push(dataObj.data.low.countSum);
      this.stackedChartData[1].data.push(dataObj.data.medium.countSum);
      this.stackedChartData[2].data.push(dataObj.data.high.countSum);
      this.stackedChartData[3].data.push(dataObj.data.veryHigh.countSum);
    });

  }

  plotHistoData(chartData) {
    /*
    Plots histo of cell concentration for a given range.
    */
    if (this.selectedRange === 'all') {
      this.plotFullHistoData(chartData);
      // TODO: full histo stats
      return;
    }
    this.histoChartLabels = chartData[this.selectedRange].data.map(obj => obj.concentration);
    this.histoChartData[0].data = chartData[this.selectedRange].data.map(obj => obj.count);
    this.histoChartData[0].backgroundColor = this.getColor(this.selectedRange);
    this.rangeStats.min = chartData[this.selectedRange].min;
    this.rangeStats.max = chartData[this.selectedRange].max;
    this.rangeStats.average = chartData[this.selectedRange].average;
    this.rangeStats.stddev = chartData[this.selectedRange].stddev;
  }

  plotFullHistoData(chartData) {
    /*
    Plots all ranges color-coded cell concentration histogram.
    */
    let histoLabels = [];
    let histoData = [];
    let histoColors = [];
    let index = 0;
    for (let key in this.dataByRange) {
      if (!this.chartLabels.includes(key)) { continue; }
      chartData[key].data.forEach(obj => {
        histoLabels.push(obj.concentration);
        histoData.push(obj.count);
        histoColors.push(this.getColor(key));
       });
      index++;
    }
    this.histoChartLabels = histoLabels;
    this.histoChartData[0].data = histoData;
    this.histoChartData[0].backgroundColor = histoColors;
  }

  plotLineData(dates: string[]) {
    /*
    Plots line data for each range.
    */
    this.lineChartLabels = [];
    this.lineChartData[0].data = [];
    this.lineChartData[1].data = [];
    this.lineChartData[2].data = [];
    this.lineChartData[3].data = [];
    dates.forEach(date => {
      let dayOfYear = this.calcs.getDayOfYear(date);
      let dataObj = this.curatedData[this.selectedDataType][dayOfYear];
      this.lineChartLabels.push(date);
      this.lineChartData[0].data.push(dataObj.data.low.countSum);
      this.lineChartData[1].data.push(dataObj.data.medium.countSum);
      this.lineChartData[2].data.push(dataObj.data.high.countSum);
      this.lineChartData[3].data.push(dataObj.data.veryHigh.countSum);
    });
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
    this.wbProps.areasqkm = this.calcs.roundValue(propResults['properties']['AREASQKM']);
    this.wbProps.elevation = this.calcs.roundValue(propResults['properties']['ELEVATION']);
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
    this.wbProps.shape_area = this.calcs.roundValue(propResults['properties']['SHAPE_AREA']);
    this.wbProps.shape_leng = this.calcs.roundValue(propResults['properties']['SHAPE_LENG']);
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
        concentration: this.calcs.roundValue(this.calcs.calculateConcentration(index))
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
    this.dataByRange = new WaterBodyDataByRange();
    concentrationData.forEach(dataObj => {
      let concentration = dataObj.concentration;
      let counts = dataObj.count;
      totalCounts += counts;
      totalConcentration += concentration;
      if (concentration <= userSettings.level_low) {
        this.dataByRange.low.countSum += counts;
        this.dataByRange.low.data.push(dataObj);
      }
      else if (concentration > userSettings.level_low && concentration <= userSettings.level_medium) {
        this.dataByRange.medium.countSum += counts;
        this.dataByRange.medium.data.push(dataObj);
      }
      else if (concentration > userSettings.level_medium && concentration <= userSettings.level_high) {
        this.dataByRange.high.countSum += counts;
        this.dataByRange.high.data.push(dataObj);
      }
      else if (concentration > userSettings.level_high) {
        this.dataByRange.veryHigh.countSum += counts;
        this.dataByRange.veryHigh.data.push(dataObj);
      }
      else {
        this.dialog.handleError('Unknown error occurred');
      }
    });
    this.dataByRange.totalCounts = totalCounts;
    this.dataByRange.totalConcentration = totalConcentration;
    this.dataByRange.totalPixelArea = 0.09 * totalCounts;  // total pixels X pixel size (sq. km)
    this.dataByRange = this.calcs.calculateRangeArea(this.dataByRange, this.chartLabels);
    this.dataByRange = this.calcs.calculatePercentOfArea(this.dataByRange, this.chartLabels);
    this.dataByRange = this.calcs.calculatePercentOfTotalArea(this.dataByRange, this.wbProps);
    this.dataByRange = this.calcs.calculateAverageForRange(this.dataByRange, this.chartLabels);
    this.dataByRange = this.calcs.calculateStddevForRange(this.dataByRange, this.chartLabels);
    this.dataByRange = this.calcs.calculateMinForRange(this.dataByRange, this.chartLabels);
    this.dataByRange = this.calcs.calculateMaxForRange(this.dataByRange, this.chartLabels);
    return this.dataByRange;
  }

  addImageLayer(image: Blob, bounds: any): any {
    let reader = new FileReader();
    reader.addEventListener("load", () => {
      let topLeft = latLng(bounds[1][0], bounds[1][1]);
      let bottomRight = latLng(bounds[0][0], bounds[0][1]);
      let imageBounds = latLngBounds(bottomRight, topLeft);
      let imageUrl = reader.result.toString();
      this.wbImageLayer = new ImageOverlay(imageUrl, imageBounds, {opacity: 1.0});
      this.cyanMap.map.addLayer(this.wbImageLayer);

      console.log("WB Image Layer: ")
      console.log(this.wbImageLayer)

      return reader.result;
    }, false);
    if (image) {
      reader.readAsDataURL(image);
    }
  }

  incrementRequest() {
    this.requestsTracker++;
    this.totalRequests++;
  }

  updateProgressBar(): void {
    this.requestsTracker--;
    let progressValue = 100 * (1 - (this.requestsTracker / this.totalRequests));
    this.loaderService.progressValue.next(progressValue);
    if (this.requestsTracker <= 0) {
      this.loaderService.hide();
      this.loaderService.progressValue.next(0);
    }
  }

  toggleSlideShow() {
    let delay = 2000; // 2 seconds
    if (this.slidershow && this.router.isActive('wbstats', false)) {
      let self = this;
      setTimeout(function() {
        self.cycleSelectedDates();
      }, delay);
    }
  }
  cycleSelectedDates() {
    /*
    Cycles through selected dates and displays the image,
    highlights dates, updates plots if applicable (what about
    showing "all" histo vs line chart?)
    */
    let selectedDates = this.datesWithinRange;
    console.log("Dates within range: ")
    console.log(selectedDates)

    let selectedAvailableDate = this.selectedAvailableDate;
    console.log("Selected avilable date: " + selectedAvailableDate)

    if (this.selectedDate.length <= 0) {
      this.selectedDate = this.selectedAvailableDate;
    }

    let selectedDate = this.selectedDate;
   

    this.selectedDateIndex = selectedDates.indexOf(selectedDate);
    console.log("Current selected date index: " + this.selectedDateIndex)

    // Cycle back to beginning if at last index
    // this.selectedDateIndex = this.selectedDateIndex < 0 || this.selectedDateIndex >= selectedDates.length - 1 ? 0 : this.selectedDateIndex++;
    if (this.selectedDateIndex < 0 || this.selectedDateIndex >= selectedDates.length - 1) {
      console.log("selectedDateIndex < 0 or >= date range array")
      this.selectedDateIndex = 0;
    }
    else {
      this.selectedDateIndex++;
    }
    console.log("New selected date index: " + this.selectedDateIndex)

    // TODO: Highlight new date in list.
    this.selectedDate = this.datesWithinRange[this.selectedDateIndex];

    let date = this.calcs.getDayOfYear(this.selectedDate);
    let year = parseInt(date.split(' ')[0]);
    let day = parseInt(date.split(' ')[1]);

    // TODO: Cycle image.
    this.getWaterbodyImage(this.wbProps.objectid, year, day);


    
    // TODO: Highlight bar in stacked bar plot for date.
    this.stackedChartData.forEach(dataObj => {
      console.log("stacked chart data obj: ")
      console.log(dataObj)
    })
    let labelIndex = 0;
    this.stackedChartLabels.forEach(dateLabel => {
      console.log("stackedChartLabels: " + dateLabel)
      if (dateLabel != this.selectedDate) {
         // gray-out dates not selected
         this.stackedChartData[labelIndex].backgroundColor + '4D';
      }
      labelIndex++;
    })

    labelIndex = 0;
    // TODO: Highlight points in line chart for date.
    this.lineChartLabels.forEach(dateLabel => {
      console.log("line chart label: ")
      console.log(dateLabel)
      if (dateLabel == this.selectedDate) {
        // increase point size to highlight
        this.lineChartData[labelIndex].pointRadius = 5;
      }
      else {
        this.lineChartData[labelIndex].pointRadius = 1; 
      }
      labelIndex++;
    });

    this.toggleSlideShow();

  }

}