import { Component } from '@angular/core';
import { ChartDataSets, ChartOptions, ChartType, ChartColor } from 'chart.js';
import { Label } from 'ng2-charts';

import { ConfigService } from '../../services/config.service';


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
      label: ''
    }
  ];
  chartOptions: ChartOptions = {
    responsive: true,
    legend: {
      display: false
    },
    scales: {
      yAxes: [{
        ticks: {
          beginAtZero: true
        }
      }],
      // xAxes: [{
      //   type: 'time'
      // }]
    },
    plugins: {
      datalabels: {
        display: 'auto',
        color: 'black',
        // borderColor: 'white',
        font: {
          weight: 'bold'
        },
        backgroundColor: 'white',
        // align: (context): any => {
        //   console.log("Align called. Context: ", context)
        //   let yTickSize = context.chart.options.scales.yAxes[0].ticks.stepSize;
        //   let barData = context.dataset.data[barIndex];
        //   console.log("Bar index: ", barIndex)
        //   console.log("y tick size: ", yTickSize)
        //   console.log("Bar data: ", barData)
        //   if (barData <= yTickSize) {
        //     return 'top';
        //   }
        //   else {
        //     return 'center';
        //   }
        // }
      }
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
      display: true
    },
    plugins: {
      datalabels: {
        display: 'auto',
        color: 'black',
        backgroundColor: 'white',
        font: {
          weight: 'bold'
        },
        formatter: (value, dict1) => {
          return value + '%';
        }
      }
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
  pieChartColors2: Array<any> = [
    {
      backgroundColor: [
        this.configService.green,
        this.configService.yellow,
        this.configService.orange,
        this.configService.red,
        this.configService.belowDetection,
        this.configService.land,
        this.configService.noData
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
  public histoChartOptions: ChartOptions = {
    responsive: true,
    legend: {
      display: false
    },
    plugins: {
      datalabels: {
        display: false
      }
    }
  };
  histoChartLegend: boolean = true;

  // Stacked bar chart parameters:
  public stackedChartData: ChartDataSets[] = [
    {
      data: [],
      label: 'low',
      stack: 'a',
      backgroundColor: this.configService.green,
      hoverBackgroundColor: this.configService.darkGreen,
      pointRadius: 1
    },
    {
      data: [],
      label: 'medium',
      stack: 'a',
      backgroundColor: this.configService.yellow,
      hoverBackgroundColor: this.configService.darkYellow,
      pointRadius: 1
    },
    {
      data: [],
      label: 'high',
      stack: 'a',
      backgroundColor: this.configService.orange,
      hoverBackgroundColor: this.configService.darkOrange,
      pointRadius: 1
    },
    {
      data: [],
      label: 'veryHigh',
      stack: 'a',
      backgroundColor: this.configService.red,
      hoverBackgroundColor: this.configService.darkRed,
      pointRadius: 1
    }
  ];
  public stackedChartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      datalabels: {
        display: false,
        backgroundColor: (context): any => {
          console.log("backgroundColor context: ", context);
        }
      }
    },
    tooltips: {
      mode: 'index'
    }
  };
  public stackedChartColors: Array<any> = [];
  public stackedChartType: ChartType = 'bar';
  public stackedChartLabels: Label[] = [];
  public stackedChartLegend: boolean = true;

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
    },
    plugins: {
      datalabels: {
        display: false,
        color: 'black',
        borderColor: 'white',
        font: {
          weight: 'bold'
        }
      },
    },
    tooltips: {
      mode: 'index',
      bodyAlign: 'right',
      position: 'nearest'
    }
  };
  public lineChartColors: Array<any> = [];
  public lineChartType: ChartType = 'line';
  public lineChartLabels: Label[] = [];
  public lineChartLegend: boolean = true;

  constructor(
    private configService: ConfigService,
  ) { }

}