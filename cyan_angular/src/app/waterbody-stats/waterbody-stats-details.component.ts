import { Component, OnInit, Inject, Input, ViewChild, ViewChildren, ElementRef, QueryList } from '@angular/core';
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
import { Calculations } from './utils/calculations';
import { Charts } from './utils/charts';



@Component({
  selector: 'app-waterbody-stats-details',
  templateUrl: './waterbody-stats-details.component.html',
  styleUrls: ['./waterbody-stats.component.css']
})
export class WaterBodyStatsDetails {
  /*
  Dialog for viewing waterbody stats.
  */

  // @ViewChild(BaseChartDirective) private stackedChart: BaseChartDirective;
  // @ViewChild(BaseChartDirective) private barChart: BaseChartDirective;
  // @ViewChild(BaseChartDirective) private pieChart: BaseChartDirective;
  // @ViewChild(BaseChartDirective) private lineChart: BaseChartDirective;

  @ViewChildren(BaseChartDirective) private chartObjs: Array<BaseChartDirective>;

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
  wbTotalPixelArea: number = 0;  // total area calculated with sum of pixel counts

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
  slideshowDelay: number = 4000;  // units of seconds
  slideshowStatus: string = this.slidershow ? "Slideshow started" : "Start slideshow";

  // Bar chart parameters:
  public chartLabels: Label[] = this.ranges;
  public chartLabels1: Label[] = this.ranges;
  // public chartLabels2: Label[] = ['low', 'medium', 'high', 'veryHigh', 'no data'];
  public chartLabels2: Label[] = ['low', 'medium', 'high', 'veryHigh', 'below detection', 'land', 'no data'];
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
  public pieChartLabels: Label[] = this.charts.pieChartLabels;

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
  public histoChartOptions: ChartOptions = this.charts.histoChartOptions;
  public histoChartLegend: boolean = this.charts.histoChartLegend;

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
  showUserLegend: boolean = false;

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
      this.selectedWaterbody = JSON.parse(params.selectedWaterbody);
      this.wbProps = JSON.parse(params.wbProps);
      this.loaderService.showProgressBar();
      this.loaderService.show();
      this.getWaterbodyData('daily');
      this.getWaterbodyData('weekly');
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
        this.cyanMap.map.removeLayer(this.wbImageLayer);
      }
      let imageBlob = response.body;
      let bbox = [
        [this.wbProps.y_min, this.wbProps.x_max],
        [this.wbProps.y_max, this.wbProps.x_min]
      ];
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

    if (Object.keys(this.waterbodyData[dataType]['data']).length < 1) {
      this.dialog.handleError('No ' + this.selectedDataType + 'data found for waterbody');
    }

    this.curatedData[dataType]['dates'] = [];
    this.curatedData[dataType]['formattedDates'] = [];

    let orderedArrayOfData = this.calcs.sortByDate(this.waterbodyData[dataType]['data']);

    orderedArrayOfData.forEach(dataObj => {

      let date = Object.keys(dataObj)[0]
      
      this.curatedData[dataType][date] = {
        stats: null,  // waterbody stats
        data: null  // curated data for plots, divided by range
      };

      let dataArray = this.waterbodyData[dataType].data[date];
      let concentrationData = this.createCellArray(dataArray);  // array of concentration, count, index objects
      let concentrationArray = concentrationData.filter(obj => obj.count > 0).map(obj => obj.concentration);
      let chartData = this.createChartData(concentrationData);  // data by range for date

      let wbStats = new WaterBodyStats();
      wbStats.date = this.calcs.getDateFromDayOfYear(date);
      wbStats.min = this.calcs.roundValue(Math.min(...concentrationArray));  // min concentration with at least one count
      wbStats.max = this.calcs.roundValue(Math.max(...concentrationArray));  // max concentration with at least one count
      wbStats.average = this.calcs.calculateAverage(concentrationData);
      wbStats.stddev = this.calcs.calculateStdDev(concentrationData);
      
      this.curatedData[dataType][date].stats = wbStats;
      this.curatedData[dataType][date].data = chartData;
      this.curatedData[dataType].dates.push(date);
      this.curatedData[dataType].formattedDates.push(wbStats.date);

      let belowDetectionCounts = this.waterbodyData[dataType].data[date][0];
      let landCounts = this.waterbodyData[dataType].data[date][254];
      let noDataCounts = this.waterbodyData[dataType].data[date][255];

      this.curatedData[dataType][date].data.countsBelowDetection = belowDetectionCounts;
      this.curatedData[dataType][date].data.countsLand = landCounts;
      this.curatedData[dataType][date].data.countsNoData = noDataCounts;

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


    this.wbTotalPixelArea = this.waterbodyData[this.selectedDataType].data[dateKey].reduce((a, b) => a + b, 0);

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
      this.selectedDate = this.selectedAvailableDate;  // initializes selectedDate for slideshow
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
      this.scrollToSelectedDate();
    }
    else {
      // Single-day range
      // TODO: Plot classic bars and histo for selected available date.
      // TODO: Plot bars or pie based on selectedPlotType
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

  toggleUserLegend() {
    this.showUserLegend = !this.showUserLegend; 
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
    this.pieChartLabels = this.chartLabels1;
    this.pieChartColors = this.charts.pieChartColors;
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
    this.pieChartLabels = this.chartLabels2;
    this.pieChartColors = this.charts.pieChartColors2;

    let noCyanoPercent = 100.0 - chartData.percentOfTotalArea;

    let noCyanoArea = chartData.totalPixelArea * (noCyanoPercent / chartData.percentOfTotalArea);  // method A

    let noCyanoTotalCounts = chartData.countsBelowDetection + chartData.countsLand + chartData.countsNoData;


    let belowDetectionPercent = chartData.countsBelowDetection / noCyanoTotalCounts;  // decimal percent
    let landPercent = chartData.countsLand / noCyanoTotalCounts;  // decimal percent
    let noDataPercent = chartData.countsNoData / noCyanoTotalCounts;  // decimal percent


    let percentAreaData = [
      this.calcs.roundValue((chartData.low.percentOfArea * chartData.percentOfTotalArea) / 100.0),
      this.calcs.roundValue((chartData.medium.percentOfArea * chartData.percentOfTotalArea) / 100.0),
      this.calcs.roundValue((chartData.high.percentOfArea * chartData.percentOfTotalArea) / 100.0),
      this.calcs.roundValue((chartData.veryHigh.percentOfArea * chartData.percentOfTotalArea) / 100.0),
      this.calcs.roundValue(100.0 * belowDetectionPercent),
      this.calcs.roundValue(100.0 * landPercent),
      this.calcs.roundValue(100.0 * noDataPercent)
    ];
    this.pieChartData[0].data = percentAreaData;
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
    this.dataByRange.totalPixelArea = 0.09 * totalCounts;  // total pixels X pixel size (0.09 sqkm/pixel)

    this.dataByRange = this.calcs.calculateRangeArea(this.dataByRange, this.chartLabels);
    this.dataByRange = this.calcs.calculatePercentOfArea(this.dataByRange, this.chartLabels);
    this.dataByRange = this.calcs.calculatePercentOfTotalArea(this.dataByRange, this.wbProps);
    this.dataByRange = this.calcs.calculateAverageForRange(this.dataByRange, this.chartLabels);
    this.dataByRange = this.calcs.calculateStddevForRange(this.dataByRange, this.chartLabels);
    this.dataByRange = this.calcs.calculateMinForRange(this.dataByRange, this.chartLabels);
    this.dataByRange = this.calcs.calculateMaxForRange(this.dataByRange, this.chartLabels);

    return this.dataByRange;
  }

  // addImageLayer(imageUrl: string, bounds: any): any {
  //   let topLeft = latLng(bounds[1][0], bounds[1][1]);
  //   let bottomRight = latLng(bounds[0][0], bounds[0][1]);
  //   let imageBounds = latLngBounds(bottomRight, topLeft);
  //   this.wbImageLayer = new ImageOverlay(imageUrl, imageBounds, {opacity: 1.0});
  //   this.cyanMap.map.addLayer(this.wbImageLayer);
  // }

  addImageLayer(image: Blob, bounds: any): any {
    let reader = new FileReader();
    reader.addEventListener("load", () => {
      let topLeft = latLng(bounds[1][0], bounds[1][1]);
      let bottomRight = latLng(bounds[0][0], bounds[0][1]);
      let imageBounds = latLngBounds(bottomRight, topLeft);
      let imageUrl = reader.result.toString();
      this.wbImageLayer = new ImageOverlay(imageUrl, imageBounds, {opacity: 1.0});
      this.cyanMap.map.addLayer(this.wbImageLayer);
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
    if (this.slidershow && this.router.isActive('wbstats', false)) {
      let self = this;
      setTimeout(function() {
        self.cycleSelectedDates();
      }, this.slideshowDelay);
    }
    else {
      this.slideshowStatus = ""
    }
  }
  cycleSelectedDates() {
    /*
    Cycles through selected dates and displays the image,
    highlights dates, updates plots if applicable (what about
    showing "all" histo vs line chart?)
    */
    let selectedDates = this.datesWithinRange;
    let selectedAvailableDate = this.selectedAvailableDate;

    if (this.selectedDate.length <= 0) {
      this.selectedDate = this.selectedAvailableDate;
    }

    // let selectedDate = this.selectedDate;
    // this.selectedDateIndex = selectedDates.indexOf(selectedDate);
    this.selectedDateIndex = selectedDates.indexOf(this.selectedDate);

    // Cycle back to beginning if at last index
    // this.selectedDateIndex = this.selectedDateIndex < 0 || this.selectedDateIndex >= selectedDates.length - 1 ? 0 : this.selectedDateIndex++;
    if (this.selectedDateIndex < 0 || this.selectedDateIndex >= selectedDates.length - 1) {
      this.selectedDateIndex = 0;
    }
    else {
      this.selectedDateIndex++;
    }

    // TODO: Highlight new date in list.
    this.selectedDate = this.datesWithinRange[this.selectedDateIndex];

    // let selectedDateElement = document.getElementById('selected-dates-list');
    // selectedDateElement.children[this.selectedDateIndex].scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'start'});
    this.scrollToSelectedDate();


    let date = this.calcs.getDayOfYear(this.selectedDate);
    let year = parseInt(date.split(' ')[0]);
    let day = parseInt(date.split(' ')[1]);

    // TODO: Cycle image.
    this.getWaterbodyImage(this.wbProps.objectid, year, day);

    console.log("stackedChartData: ", this.stackedChartData)

    // // TODO: Highlight points in line chart for date.
    // this.lineChartLabels.forEach(dateLabel => {
    //   console.log("line chart label: ")
    //   console.log(dateLabel)
    //   if (dateLabel == this.selectedDate) {
    //     // increase point size to highlight
    //     this.lineChartData[labelIndex].pointRadius = 5;
    //   }
    //   else {
    //     this.lineChartData[labelIndex].pointRadius = 1; 
    //   }
    //   labelIndex++;
    // });

    // console.log("Stacked Chart: ", this.stackedChart);
    // console.log("Bar Chart: ", this.barChart);
    // console.log("Pie Chart: ", this.pieChart)
    // console.log("Line chart: ", this.lineChart)

    console.log("charts: ", this.chartObjs);

    this.chartObjs.forEach((chart) => {
      console.log("Chart: ", chart)
      this.triggerHover(chart.chart);
    });

    // TODO: Highlight points in line chart for selected slideshow date:

    // TODO: If x-labels can also correspond to a bar, highlight the date label during slideshow?

    // let chartObj = this.chartObjs['_results'];
    // let chartObj = this.stackedChart.chart;
    // this.triggerHover(this.stackedChart.chart);
    // this.triggerHover(chartObj);

    this.toggleSlideShow();

  }

  triggerHover(chart) {
    // TODO: Remove hover highlighting if slideshow is stopped.
    // TODO: Go back to original "available date" if slideshow is stopped.

    // console.log("triggerHover called.")
    // console.log("Chart: ", chart)
    // console.log("Selected state index: ", this.selectedDateIndex)

    let meta = chart.getDatasetMeta(0);
    let rect = chart.canvas.getBoundingClientRect();
    let point = meta.data[this.selectedDateIndex].getCenterPoint();
    let evt = new MouseEvent('mousemove', {
      clientX: rect.left + point.x,
      clientY: rect.top + point.y
    });
    let node = chart.canvas;
    node.dispatchEvent(evt);
  }

  scrollToSelectedDate() {
    /*
    Scrolls to selected date in the "Selected dates" selection list.
    */
    let selectedDateElement = document.getElementById('selected-dates-list');
    selectedDateElement.children[this.selectedDateIndex].scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'start'});
  }

  downloadHistoCSV() {
    /*
    Downloads histogram data as CSV.
    */
    if (!this.authService.checkUserAuthentication()) { return; }
    let dialogRef = this.dialog.displayMessageDialog('Download histogram data for ' + this.selectedWaterbody.name + '?');
    dialogRef.afterClosed().subscribe(response => {
      if (response !== true) {
        return;
      }
      this.loaderService.show();
      this.downloader.downloadHistoData(this.selectedWaterbody.objectid).subscribe(response => {
        this.loaderService.hide();
        let histoCsvData = response.body;
        let dataRows = histoCsvData.split('\n');
        dataRows.splice(-1);  // removes trailing '' array item
        let dataArray = dataRows.map(item => item.split(','));
        let filename = 'WaterbodyHistogram' + this.selectedWaterbody.objectid + 
                        this.selectedWaterbody.name.replace(/\s/g, '') + '.csv';
        this.downloader.downloadFile(filename, histoCsvData);
      });
    });
  }


}