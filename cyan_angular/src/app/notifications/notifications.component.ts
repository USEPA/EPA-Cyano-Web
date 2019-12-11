import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { Location } from '../models/location';
// import { LocationService } from '../services/location.service';
// import { MapService } from '../services/map.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {

	new_notifications = [];
	notificationSubscription: Subscription;

  constructor(
		// private router: Router,
		private userService: UserService
  ) { }

  ngOnInit() {

		this.new_notifications = this.userService.currentAccount.notifications;

  	// Is this needed?
		this.notificationSubscription = this.userService.allNotifications$.subscribe(
			notifications => {
				console.log("Received notifications update in notifications component.");
				this.new_notifications = notifications;
			}
		);
  }

  ngOnDestroy() {
		this.notificationSubscription.unsubscribe();
  }

  toggleChecked() {
  }

  hasNotifications() {
  }

  notificationSelect() {
  	/*
  	Check status of notification and set bool based on
  	is_new Notification attribute.
  	*/
  	
  }

}
