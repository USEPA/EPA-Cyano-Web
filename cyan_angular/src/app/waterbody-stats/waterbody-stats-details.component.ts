import { Component, OnInit, Inject, Input, ViewChild, ViewChildren, ElementRef, QueryList } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field'
import { latLng, latLngBounds, tileLayer, marker, icon, Map, Marker, geoJSON, imageOverlay, ImageOverlay } from 'leaflet';
import { ChartDataset, ChartOptions, ChartType, Color } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ActivatedRoute, Router } from '@angular/router';
import { Options, ChangeContext } from 'ng5-slider';

import {
  WaterBody,
  WaterBodyStats,
  WaterBodyProperties,
  WaterBodyDataByRange,
  RangeItem,
  WaterBodyMetrics
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
  wbMetrics: WaterBodyMetrics = new WaterBodyMetrics();
  rangeStats: RangeItem = new RangeItem();
  wbTotalPixelArea: number = 0;  // total area calculated with sum of pixel counts

  dataByRange: WaterBodyDataByRange = new WaterBodyDataByRange();

  selectedDate: string = '';  // dates selection element
  selectedAvailableDate: string = '';
  selectedAvailableDateObj: Date;

  selectedDataType: string = 'daily';  // daily or weekly selection element
  dataTypes: string[] = ['daily', 'weekly'];

  selectedRange: string = 'low';  // selected range for stats (e.g., low, medium, high, veryHigh)
  ranges: string[] = ['low', 'medium', 'high', 'veryHigh'];

  selectedDateRange: string = '1day';  // single, 7day, or 30day
  dateRanges: string[] = ['1day', '7day', '30day'];
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

  // Selected date slider options:
  sliderValue: number = 0;
  sliderOptions: Options = {
    showTicksValues: true,
    stepsArray: []
  };


  // Bar chart parameters:
  // public chartLabels: Label[] = this.ranges;
  public chartLabels: string[] = this.ranges;
  // public chartLabels1: Label[] = this.ranges;
  public chartLabels1: string[] = this.ranges;
  // public chartLabels2: Label[] = ['low', 'medium', 'high', 'veryHigh', 'no data'];
  // public string: Label[] = ['low', 'medium', 'high', 'veryHigh', 'no data'];
  // public chartLabels2: Label[] = ['low', 'medium', 'high', 'veryHigh', 'below detection', 'land', 'no data'];
  public chartLabels2: string[] = ['low', 'medium', 'high', 'veryHigh', 'below detection', 'land', 'no data'];
  @Input() chartData: ChartDataset[] = this.charts.chartData;
  public chartOptions: ChartOptions = this.charts.chartOptions;
  public chartColors: Array<any> = this.charts.chartColors
  public chartLegend: boolean = this.charts.chartLegend;
  public chartType: ChartType = this.charts.chartType;

  @Input() pieChartData: ChartDataset[] = this.charts.pieChartData;
  public pieChartOptions: ChartOptions = this.charts.pieChartOptions;
  public pieChartColors: Array<any> = this.charts.pieChartColors
  public pieChartLegend: boolean = this.charts.pieChartLegend;
  public pieChartType: ChartType = this.charts.pieChartType;
  // public pieChartLabels: Label[] = this.charts.pieChartLabels;
  public pieChartLabels: string[] = this.charts.pieChartLabels;

  // Stacked bar chart parameters:
  public stackedChartData: ChartDataset[] = this.charts.stackedChartData;
  public stackedChartOptions: ChartOptions = this.charts.stackedChartOptions;
  public stackedChartColors: Array<any> = this.charts.stackedChartColors;
  public stackedChartType: ChartType = this.charts.stackedChartType;
  // public stackedChartLabels: Label[] = this.charts.stackedChartLabels;
  public stackedChartLabels: string[] = this.charts.stackedChartLabels;

  showStacked: boolean = false;
  showPie: boolean = false;
  showBars: boolean = true;

  // Histo chart parameters:
  // public histoChartLabels: Label[] = [];  // TODO: define dynamically
  public histoChartLabels: string[] = [];  // TODO: define dynamically
  @Input() histoChartData: ChartDataset[] = [
    {
      data: [],
      label: ''
    }
  ];
  public histoChartType: ChartType = 'bar';
  public histoChartOptions: ChartOptions = this.charts.histoChartOptions;
  public histoChartLegend: boolean = this.charts.histoChartLegend;

  // Line chart parameters:
  public lineChartData: ChartDataset[] = this.charts.lineChartData;
  public lineChartOptions: ChartOptions = this.charts.lineChartOptions;
  public lineChartColors: Array<any> = this.charts.lineChartColors;
  public lineChartType: ChartType = this.charts.lineChartType;
  // public lineChartLabels: Label[] = this.charts.lineChartLabels;
  public lineChartLabels: string[] = this.charts.lineChartLabels;

  wbLayer = null;
  wbImageLayer = null;

  requestsTracker: number = 0;
  totalRequests: number = 0;

  showLegend: boolean = false;
  showUserLegend: boolean = false;

  currentDate: Date;
  prevDate30Days: Date;
  prevDate: Date;

  totalPrevDayAttempts: number = 365;
  currentAttempts: number = 0;

  isLoading: boolean = false;

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

      let currentDate = this.calcs.getDayOfYearFromDateObject(new Date());

      this.getMostCurrentAvailableDate();

      this.getWaterbodyGeojson(this.selectedWaterbody);

    });
  }

  exit(): void {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.removeLayers();
  }

  getMostCurrentAvailableDate() {
    /*
    Makes requests for most current available date. Goes back
    previous days until it finds an available date.
    */

    let prevDate = this.calcs.getDayOfYearFromDateObject(
      new Date(new Date().setDate(new Date().getDate() - this.currentAttempts))
    );
    let startYear = parseInt(prevDate.split(' ')[0]);
    let startDay = parseInt(prevDate.split(' ')[1]);

    this.isLoading = true;

    this.downloader.getWaterbodyData(
      this.selectedWaterbody.objectid,
      this.dataTypeRequestMap['daily'],
      startYear,
      startDay,
      startYear,
      startDay
    )
    .subscribe(result => {

      this.waterbodyData['daily']['daily'] = result['daily'];
      this.waterbodyData['daily']['data'] = result['data'];

      if (
        Object.keys(this.waterbodyData['daily']).length <= 0 ||
        Object.keys(this.waterbodyData['daily']['data']).length <= 0
      ) {
        // No data, retry with the date before this one:
        if (this.currentAttempts >= this.totalPrevDayAttempts) {
          this.isLoading = false;
          this.currentAttempts = 0;
          this.dialog.handleError('No ' + this.selectedDataType + ' waterbody data currently available');
        }
        this.currentAttempts += 1;
        this.getMostCurrentAvailableDate();
      }
      else {

        this.isLoading = false;
        this.currentAttempts = 0;

        this.selectedAvailableDateObj = new Date(this.calcs.getDateFromDayOfYear(prevDate));
        this.selectedAvailableDate = this.calcs.getFormattedDateFromDateObject(this.selectedAvailableDateObj);
        
        this.displayStats(result);
        this.setWaterbodyMetrics(result);
      }

    });

  }

  getWaterbodyGeojson(wb: WaterBody): void {
    /*
    Makes request to cyan-waterbody to get
    geojson of selected waterbody, then adds
    it as a map layer.
    */
    this.removeLayers();
    this.downloader.getWaterbodyGeometry(wb.objectid).subscribe(response => {
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
    this.isLoading = true;
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
      this.isLoading = false;
    });
  }

  displayStats(wbData: any) {

    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    // TODO: Account for stats, data, and plots for various date ranges
    // For daily: 1, 7, and 30 days
    // For weekly: 1, 4, and 12/16 weeks
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    let orderedArrayOfData = this.calcs.sortByDate(wbData['data']);

    this.curatedData[this.selectedDataType]['dates'] = [];
    this.curatedData[this.selectedDataType]['formattedDates'] = [];

    let chartData;
    // Building array for total date range to perform stats on

    orderedArrayOfData.forEach(dataObj => {

      let date = Object.keys(dataObj)[0]
      let dataArray = wbData['data'][date];
      let concentrationData = this.createCellArray(dataArray);  // array of concentration, count, index objects
      let concentrationArray = concentrationData.filter(obj => obj.count > 0).map(obj => obj.concentration);
      chartData = this.createChartData(concentrationData);  // data by range for date

      this.curatedData[this.selectedDataType][date] = {
        stats: null,  // waterbody stats
        data: null  // curated data for plots, divided by range
      };

      this.wbStats.date = this.calcs.getDateFromDayOfYear(date);
      this.wbStats.min = (concentrationArray.length > 0) ? this.calcs.roundValue(Math.min(...concentrationArray)) : 0;  // min concentration with at least one count
      this.wbStats.max = (concentrationArray.length > 0) ? this.calcs.roundValue(Math.max(...concentrationArray)) : 0;  // max concentration with at least one count
      this.wbStats.average = this.calcs.calculateAverage(concentrationData);
      this.wbStats.stddev = this.calcs.calculateStdDev(concentrationData);

      this.curatedData[this.selectedDataType][date].stats = this.wbStats;
      this.curatedData[this.selectedDataType][date].data = chartData;
      this.curatedData[this.selectedDataType].dates.push(date);
      this.curatedData[this.selectedDataType].formattedDates.push(this.wbStats.date);

      let belowDetectionCounts = dataArray[0];
      let landCounts = dataArray[254];
      let noDataCounts = dataArray[255];

      this.curatedData[this.selectedDataType][date].data.countsBelowDetection = belowDetectionCounts;
      this.curatedData[this.selectedDataType][date].data.countsLand = landCounts;
      this.curatedData[this.selectedDataType][date].data.countsNoData = noDataCounts;

      this.wbTotalPixelArea = dataArray.reduce((a, b) => a + b, 0);

      let year = parseInt(date.split(' ')[0]);  // e.g., "2021 03"
      let day = parseInt(date.split(' ')[1]);

      this.getWaterbodyImage(this.wbProps.objectid, year, day);

    });

    console.log("Curated data: ", this.curatedData)

    if (['7day', '30day'].includes(this.selectedDateRange)) {
      // Multi-day plotting:
      let dateRange = parseInt(this.selectedDateRange.split('day')[0]);
      let d = new Date(this.selectedAvailableDate);
      let endDate = d.getTime();
      let startDate = new Date(this.selectedAvailableDate).setDate(d.getDate() - dateRange);
      this.datesWithinRange = this.curatedData[this.selectedDataType].formattedDates.filter(date => {
        let d = new Date(date).getTime();
        if (d <= endDate && d > startDate) {
          return true;
        }
      }).reverse();  // orders dates earliest to latest

      this.updateSlider();

      this.plotRangeOfTotalCounts(this.datesWithinRange);
      this.plotLineData(this.datesWithinRange);
    }
    else {
      // Single date plotting
      this.handlePlot(chartData);
      if (this.selectedDate == 'all') {
        this.plotLineData(this.curatedData[this.selectedDataType].formattedDates);
      }
      else {
        this.plotHistoData(chartData);
      }
      this.calculatingStats = true;  // displays stats for selected date
      this.plotStats = true;  // displays plot of cell counts
    }


  }

  determineDateRanges(initDateObj, prevDaysAmount) {
    /*
    initDateObj -- the starting day, which in this case is the later date.
    prevDaysAmount -- amount of days to go back for date range (7 or 30).
    */
    let initDate = this.calcs.getDayOfYearFromDateObject(initDateObj);
    let prevDateObj = new Date(initDateObj.setDate(initDateObj.getDate() - prevDaysAmount));
    let prevDate = this.calcs.getDayOfYearFromDateObject(prevDateObj);
    let startYear = parseInt(prevDate.split(' ')[0]);
    let startDay = parseInt(prevDate.split(' ')[1]);
    let endYear = parseInt(initDate.split(' ')[0]);
    let endDay = parseInt(initDate.split(' ')[1]);
    return [startYear, startDay, endYear, endDay];
  }

  updateDataType(dataTypeValue: string) {
    /*
    Selection change for data type.
    */

    this.selectedDataType = dataTypeValue;

    this.wbStats.dates = this.curatedData[dataTypeValue].formattedDates;  // sets dates based on selected data type (daily/weekly)

    if (!this.dataTypes.includes(dataTypeValue)) {
      this.dialog.handleError('Data type must be "daily" or "weekly"');
    } 
    else if(!this.selectedAvailableDate || !this.dateRanges.includes(this.selectedDateRange)) {
      return;
    }
    // this.calculateWaterbodyStats(this.selectedAvailableDate);
  }

  updateDate(dateValue: Date) {
    /*
    Selection change for available dates.
    */

    // TODO: set selectedAvailableDate to MM/DD/YYYY format?
    this.selectedAvailableDate = this.calcs.getDateFromDayOfYear(this.calcs.getDayOfYearFromDateObject(dateValue));
    this.selectedAvailableDateObj = new Date(this.selectedAvailableDate)

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
      this.selectedDateRange = '';
      this.dialog.handleError('Select a data type and/or date range first');
    }

    let dateRangeNumber = parseInt(dateRangeValue.split('day')[0]) - 1;
    let dateRangeArray = this.determineDateRanges(new Date(this.selectedAvailableDate), dateRangeNumber);

    this.isLoading = true;
    this.downloader.getWaterbodyData(
      this.selectedWaterbody.objectid,
      this.dataTypeRequestMap['daily'],
      dateRangeArray[0],
      dateRangeArray[1],
      dateRangeArray[2],
      dateRangeArray[3]
    )
    .subscribe(result => {
      this.isLoading = false;
      this.displayStats(result);
      this.setWaterbodyMetrics(result);
    });

  }

  updateSlider() {
    this.selectedDate = this.datesWithinRange[this.datesWithinRange.length - 1];  // sets date to cycle to first date in range
    this.sliderValue = 0;  // sets slider to earliest date
    this.slidershow = false;  // ensures slideshow stops
    this.cycleSelectedDates();  // selects initial date (runs slideshow once)
    const newSliderOptions: Options = Object.assign({}, this.sliderOptions);
    newSliderOptions.stepsArray = [];
    this.datesWithinRange.forEach(date => {
      newSliderOptions.stepsArray.push({
        value: this.datesWithinRange.indexOf(date),
        legend: date
      });
    });
    newSliderOptions.showTicksValues = true;
    this.sliderOptions = newSliderOptions;
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

    let allCounts = chartData.low.countSum
     + chartData.medium.countSum
     + chartData.high.countSum
     + chartData.veryHigh.countSum
     + chartData.countsBelowDetection
     + chartData.countsLand
     + chartData.countsNoData;

    let percentAreaData = [
      this.calcs.roundValue(100.0 * (chartData.low.countSum / allCounts)),
      this.calcs.roundValue(100.0 * (chartData.medium.countSum / allCounts)),
      this.calcs.roundValue(100.0 * (chartData.high.countSum / allCounts)),
      this.calcs.roundValue(100.0 * (chartData.veryHigh.countSum / allCounts)),
      this.calcs.roundValue(100.0 * (chartData.countsBelowDetection / allCounts)),
      this.calcs.roundValue(100.0 * (chartData.countsLand / allCounts)),
      this.calcs.roundValue(100.0 * (chartData.countsNoData / allCounts))
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

    this.selectedDateIndex = selectedDates.indexOf(this.selectedDate);

    // Cycle back to beginning if at last index
    if (this.selectedDateIndex < 0 || this.selectedDateIndex >= selectedDates.length - 1) {
      this.selectedDateIndex = 0;
    }
    else {
      this.selectedDateIndex++;
    }

    this.selectedDate = this.datesWithinRange[this.selectedDateIndex];

    // Updates slider to new selected date:
    this.sliderValue = this.selectedDateIndex;


    let date = this.calcs.getDayOfYear(this.selectedDate);
    let year = parseInt(date.split(' ')[0]);
    let day = parseInt(date.split(' ')[1]);

    this.getWaterbodyImage(this.wbProps.objectid, year, day);

    this.chartObjs.forEach((chart) => {
      this.triggerHover(chart.chart);
    });

    this.toggleSlideShow();

  }

  triggerHover(chart) {
    // TODO: Remove hover highlighting if slideshow is stopped.
    // TODO: Go back to original "available date" if slideshow is stopped.

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

  sliderEvent() {
    
    if (this.slidershow === true) {
      this.selectedDate = this.datesWithinRange[this.sliderValue];
      return;  // skip cycle call if already playing slideshow
    }
    else {
      if (this.sliderValue === 0) {
      this.selectedDate = this.datesWithinRange[this.datesWithinRange.length - 1];
      }
      else {
        this.selectedDate = this.datesWithinRange[this.sliderValue - 1];
      }
      this.cycleSelectedDates();
    }
    
  }

  setWaterbodyMetrics(wbData) {
    /*
    Adds metrics to WB stats feature that's returned
    from the waterbody/data request.
    */
    let objectid = this.selectedWaterbody.objectid.toString();
    this.wbMetrics.areaNormalizedMagnitude = wbData['metrics']['area_normalized_magnitude'][objectid];
    this.wbMetrics.chiaNormalizedMagnitude = wbData['metrics']['chia_normalized_magnitude'][objectid];
    this.wbMetrics.extentWb = wbData['metrics']['extent_wb'][objectid];
    this.wbMetrics.frequencyWb = wbData['metrics']['frequency_wb'][objectid];
    this.wbMetrics.magnitudeWb = wbData['metrics']['magnitude_wb'][objectid];
    this.wbMetrics.period = wbData['metrics']['metadata']['period'];
    this.wbMetrics.timestep = wbData['metrics']['metadata']['timestep'];
  }


}