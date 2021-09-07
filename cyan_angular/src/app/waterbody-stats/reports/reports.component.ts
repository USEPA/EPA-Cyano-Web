import { Component, OnInit } from '@angular/core';
import { DownloaderService } from '../../services/downloader.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {

	reportTypeOptions: any = {
  	'tribe': 'Tribe',
  	'county': 'County',
  	'state': 'State'
  }

	selectedReportType: string = '';

	wbTribes: string[] = [];  // list of available Tribes
	wbStates: string[] = [];  // list of available States
	wbCounties: string[] = [];  // list of available Counties

  constructor(
  	private downloader: DownloaderService
  ) { }

  ngOnInit(): void {
  	this.getTribes();
		this.getCounties();
		this.getStates();
  }

  onReportSelect(event): void {
  	console.log("onReportSelect() called: ", event)
  	this.selectedReportType = event.value;
  }

  onTribeSelect(event): void {
  	console.log("onTribeSelect() called: ", event)
  }

	onStateSelect(event): void {
		console.log("onStateSelect() called: ", event)
	}

	onCountySelect(event): void {
		console.log("onCountySelect() called: ", event)
	}

	getTribes() {
		this.downloader.getTribes().subscribe(response => {
			console.log("getTribes() response: ", response)
			this.wbTribes = response['tribes'];
		});
	}

	getCounties() {
		this.downloader.getCounties().subscribe(response => {
			console.log("getCounties() response: ", response)
			this.wbCounties = response['counties'];
		});
	}

	getStates() {
		this.downloader.getStates().subscribe(response => {
			console.log("getStates() response: ", response)
			this.wbStates = response['states'];
		});
	}

	parseResults(resultType: string) {

	}

}
