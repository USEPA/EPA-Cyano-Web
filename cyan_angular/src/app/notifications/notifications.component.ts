import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { Location } from '../models/location';
// import { LocationService } from '../services/location.service';
// import { MapService } from '../services/map.service';
import { UserService } from '../services/user.service';
import { DownloaderService } from '../services/downloader.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {

	new_notifications = [];
  new_notifications_counter: number = 0;

  showNotification: boolean = false;  // shows notification detail

	notificationSubscription: Subscription;

  constructor(
		// private router: Router,
		private userService: UserService,
    // private downloaderService: DownloaderService
  ) { }

  ngOnInit() {

		this.new_notifications = this.userService.currentAccount.notifications;
    this.new_notifications_counter = this.new_notifications.filter(x => x[5] === 1).length;

		this.notificationSubscription = this.userService.allNotifications$.subscribe(
			notifications => {
				console.log("Received notifications update in notifications component.");
        this.new_notifications = notifications;
        this.new_notifications_counter = notifications.filter(x => x[5] === 1).length;
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

  notificationSelect(notification) {
  	/*
  	Check status of notification and set bool based on
  	is_new Notification attribute.
  	*/
    console.log("notificationSelect() function hit.");

    if (notification[5] == 1) {
      notification[5] = 0;  // sets is_new to false

      let owner = notification[0];
      let id = notification[1];

      let notifications = this.userService.updateUserNotifications(owner, id);

    }

  }

  clearNotifications() {
    /*
    Removes all user's notifications.
    */
    console.log("clearNotifications() function hit.");
    let user = this.userService.getUserName();
    this.userService.clearUserNotifications(user);
    // Remove notifications from the list
  }

}

