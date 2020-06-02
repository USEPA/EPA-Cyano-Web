import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable()
export class LoaderService {
  isLoading = new Subject<boolean>();
  isUserLocations = new Subject<boolean>();
  progressValue = new Subject<number>();
  show() {
    this.isLoading.next(true);
  }
  hide() {
    this.isLoading.next(false);
    this.isUserLocations.next(false);
  }
  showProgressBar() {
  	this.isUserLocations.next(true);
  }
  updateProgressValue(value: number) {
  	this.progressValue.next(value);
  }
}
