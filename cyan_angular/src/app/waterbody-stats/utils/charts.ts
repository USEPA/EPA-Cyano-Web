import { Component } from '@angular/core';
import { ChartDataset, ChartOptions, ChartType, Color } from 'chart.js';
// import { Label } from 'ng2-charts';

import { ConfigService } from '../../services/config.service';


@Component({
  selector: 'app-waterbody-stats-charts',
  template: '',
  styles: []
})
export class Charts {

  // chartLabels: Label[] = ['low', 'medium', 'high', 'veryHigh'];
  chartLabels: string[] = ['low', 'medium', 'high', 'veryHigh'];
  chartData: ChartDataset[] = [
    {
      data: [],
      label: ''
    }
  ];
  chartOptions: ChartOptions = {
    responsive: true,
    // legend: {
    //   display: false
    // },
    scales: {
      yAxes: {
        beginAtZero: true,
        // ticks: {
        //   beginAtZero: true
        // },
        // scaleLabel: {
        //   display: true,
        //   labelString: "Counts"
        // }
        title: {
          display: true,
          // labelString: "Counts"
          text: "Counts"
        }
      },
      // xAxes: [{
      //   type: 'time'
      // }]
    },
    plugins: {
      legend: {
        display: false
      },
      datalabels: {
        display: 'auto',
        color: 'black',
        // borderColor: 'white',
        font: {
          weight: 'bold'
        },
        backgroundColor: 'white',

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

  // pieChartLabels: Label[] = ['low', 'medium', 'high', 'veryHigh'];
  pieChartLabels: string[] = ['low', 'medium', 'high', 'veryHigh'];
  pieChartData: ChartDataset[] = [
    {
      data: [],
      label: ''
    }
  ];
  pieChartOptions: ChartOptions = {
    responsive: true,
    // legend: {
    //   display: true
    // },
    plugins: {
      legend: {
        display: true
      },
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
  // public histoChartLabels: Label[] = [];  // TODO: define dynamically
  public histoChartLabels: string[] = [];  // TODO: define dynamically
  public histoChartData: ChartDataset[] = [
    {
      data: [],
      label: ''
    }
  ];
  public histoChartType: ChartType = 'pie';
  public histoChartOptions: ChartOptions = {
    responsive: true,
    // legend: {
    //   display: false
    // },
    plugins: {
      legend: {
        display: false
      },
      datalabels: {
        display: false
      }
    }
  };
  histoChartLegend: boolean = true;

  // Stacked bar chart parameters:
  public stackedChartData: ChartDataset[] = [
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
      },
      tooltip: {
        mode: 'index'
      }
    },
    // tooltips: {
    //   mode: 'index'
    // }
  };
  public stackedChartColors: Array<any> = [];
  public stackedChartType: ChartType = 'bar';
  // public stackedChartLabels: Label[] = [];
  public stackedChartLabels: string[] = [];
  public stackedChartLegend: boolean = true;

  // Line chart parameters:
  public lineChartData: ChartDataset[] = [
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
    // legend: {
    //   // display: false
    // },
    elements: {
      line: {
        tension: 0,
        fill: false
      }
    },
    plugins: {
      legend: {
        // display: false
      },
      datalabels: {
        display: false,
        color: 'black',
        borderColor: 'white',
        font: {
          weight: 'bold'
        }
      },
      tooltip: {
        mode: 'index',
        bodyAlign: 'right',
        position: 'nearest'
      }
    },
    // tooltips: {
    //   mode: 'index',
    //   bodyAlign: 'right',
    //   position: 'nearest'
    // }
  };
  public lineChartColors: Array<any> = [];
  public lineChartType: ChartType = 'line';
  // public lineChartLabels: Label[] = [];
  public lineChartLabels: string[] = [];
  public lineChartLegend: boolean = true;

  constructor(
    private configService: ConfigService,
  ) { }

}