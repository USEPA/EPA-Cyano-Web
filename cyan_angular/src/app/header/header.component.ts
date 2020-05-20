import { Component, OnInit, NgModule } from "@angular/core";
import { Subscription } from "rxjs";

import { environment } from "../../environments/environment";
import { LocationService } from "../services/location.service";
import { UserService } from "../services/user.service";
import { Router } from "@angular/router";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.css"]
})
export class HeaderComponent implements OnInit {
  title = "Cyanobacteria Assessment Network";
  titleAbr = "CyAN";
  titleColor = "white";
  compare_locations = [];
  locationSubscription: Subscription;
  new_notifications = [];
  notificationSubscription: Subscription;

  constructor(
    private userService: UserService,
    private locationService: LocationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.setTitle();

    this.notificationSubscription = this.userService.allNotifications$.subscribe(
      notifications => {
        // Only using new (ie, unread, is_new=true) notifications.
        this.new_notifications = notifications.filter(x => x[5] == true);
      }
    );

    this.locationSubscription = this.locationService.compare$.subscribe(
      locations => {
        this.compare_locations = locations;
      }
    );
  }

  ngOnDestroy() {
    this.notificationSubscription.unsubscribe();
    this.locationSubscription.unsubscribe();
  }

  displayLogout() {
    // Navigates to /account for user to log out.
    this.router.navigate(["/account", { loggingOut: true }]);
  }

  setTitle() {
    /*
    Sets title based on regular vs testing deploy.
    */
    if (environment.testing) {
      this.title = "Cyanobacteria Assessment Network (TESTING)";
      this.titleColor = "red";
    } else {
      this.title = "Cyanobacteria Assessment Network";
      this.titleColor = "white";
    }
  }
}
