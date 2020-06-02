import { Component } from "@angular/core";
import { Subject } from "rxjs";
import { MatDialog } from "@angular/material/dialog";

import { LoaderService } from "../../services/loader.service";

@Component({
  selector: "app-loader",
  templateUrl: "./loader.component.html",
  styleUrls: ["./loader.component.css"],
})
export class LoaderComponent {
  color = "primary";
  mode = "indeterminate";
  progress = "0"

  isLoading: Subject<boolean> = this.loaderService.isLoading;
  isUserLocations: Subject<boolean> = this.loaderService.isUserLocations;
  progressValue: Subject<number> = this.loaderService.progressValue;

  showProgressBar: boolean = false;

  constructor(
  	private loaderService: LoaderService,
  	private matDialog: MatDialog
  ) {}

  ngOnInit() {
  	this.progressValue.subscribe(value => {
  		this.progress = value.toString();
  	});
  	this.isUserLocations.subscribe(value => {
  		this.showProgressBar = value;
  	});
  }

  ngOnDestroy() {
  	console.log("loader component ngOnDestroy called.");
  	this.progressValue.next(0);
  }

  exitLoadWheel() {
  	/*
  	Removes loading wheel from blocking.
  	*/
  	// TODO: Is it possible to cancel requests? They've already been made (looped ajax), so probably not unless they're rate-limited
  	this.isLoading.next(false);
  	this.progressValue.next(0);
  }

}
