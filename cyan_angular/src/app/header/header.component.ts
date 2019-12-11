import { Component, OnInit, NgModule } from '@angular/core';
import { LocationService } from '../services/location.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  title = "Cyanobacteria Assessment Network";
  titleAbr = "CyAN";
  compare_locations = {};
  locationSubscription: Subscription;

  constructor(private locationService: LocationService) { }

  ngOnInit() {
		this.locationSubscription = this.locationService.compare$.subscribe(
			locations => {
				this.compare_locations = locations
		});
  }

	ngOnDestroy() {
		this.locationSubscription.unsubscribe();
	}

}
