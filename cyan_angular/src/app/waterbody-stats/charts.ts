import { Component } from '@angular/core';
import { ChartDataSets, ChartOptions, ChartType, ChartColor } from 'chart.js';
import { Label } from 'ng2-charts';

import { ConfigService } from '../services/config.service';


@Component({
  selector: 'app-waterbody-stats-charts',
  template: '',
  styles: []
})
export class Charts {

  chartLabels: Label[] = ['low', 'medium', 'high', 'veryHigh'];
  chartData: ChartDataSets[] = [
    {
      data: [],
      label: '',
    }
  ];
  chartOptions: ChartOptions = {
    responsive: true,
    legend: {
      display: false
    }
  };
  chartColors: Array<any> = [
    {
      backgroundColor: [
        this.configService.green,
        this.configService.yellow,
        this.configService.orange,
        this.configService.red
      ]
    }
  ];
  chartLegend: boolean = true;
  chartType: ChartType = 'bar';

  pieChartLabels: Label[] = ['low', 'medium', 'high', 'veryHigh'];
  pieChartData: ChartDataSets[] = [
    {
      data: [],
      label: ''
    }
  ];
  pieChartOptions: ChartOptions = {
    responsive: true,
    legend: {
      display: false
    }
  };
  pieChartColors: Array<any> = [
    {
      backgroundColor: [
        this.configService.green,
        this.configService.yellow,
        this.configService.orange,
        this.configService.red
      ]
    }
  ];
  pieChartLegend: boolean = true;
  pieChartType: ChartType = 'pie';

  // Histo chart parameters:
  public histoChartLabels: Label[] = [];  // TODO: define dynamically
  public histoChartData: ChartDataSets[] = [
    {
      data: [],
      label: ''
    }
  ];
  public histoChartType: ChartType = 'pie';

  // Stacked bar chart parameters:
  public stackedChartData: ChartDataSets[] = [
    {
      data: [],
      label: 'low',
      stack: 'a',
      backgroundColor: this.configService.green,
      hoverBackgroundColor: this.configService.green,
      pointRadius: 1
    },
    {
      data: [],
      label: 'medium',
      stack: 'a',
      backgroundColor: this.configService.yellow,
      hoverBackgroundColor: this.configService.yellow,
      pointRadius: 1
    },
    {
      data: [],
      label: 'high',
      stack: 'a',
      backgroundColor: this.configService.orange,
      hoverBackgroundColor: this.configService.orange,
      pointRadius: 1
    },
    {
      data: [],
      label: 'veryHigh',
      stack: 'a',
      backgroundColor: this.configService.red,
      hoverBackgroundColor: this.configService.red,
      pointRadius: 1
    }
  ];
  public stackedChartOptions: ChartOptions = {
    responsive: true
  };
  public stackedChartColors: Array<any> = [];
  public stackedChartType: ChartType = 'bar';
  public stackedChartLabels: Label[] = [];

  // Line chart parameters:
  public lineChartData: ChartDataSets[] = [
    {
      data: [],
      label: 'low',
      borderColor: this.configService.green,
      pointBackgroundColor: this.configService.green
    },
    {
      data: [],
      label: 'medium',
      borderColor: this.configService.yellow,
      pointBackgroundColor: this.configService.yellow
    },
    {
      data: [],
      label: 'high',
      borderColor: this.configService.orange,
      pointBackgroundColor: this.configService.orange
    },
    {
      data: [],
      label: 'veryHigh',
      borderColor: this.configService.red,
      pointBackgroundColor: this.configService.red
    }
  ];
  public lineChartOptions: ChartOptions = {
    responsive: true,
    legend: {
      // display: false
    },
    elements: {
      line: {
        tension: 0,
        fill: false
      }
    }
  };
  public lineChartColors: Array<any> = [];
  public lineChartType: ChartType = 'line';
  public lineChartLabels: Label[] = [];

  constructor(
    private configService: ConfigService,
  ) { }

}