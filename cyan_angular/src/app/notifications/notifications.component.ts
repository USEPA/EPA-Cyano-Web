import { Component, OnInit, Inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';

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
		private userService: UserService,
    private bottomSheet: MatBottomSheet,
    private dialog: MatDialog
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

    // Opens selected notification in bottom sheet:
    this.openNotification(notification, this.new_notifications_counter);

  }

  clearNotifications() {
    /*
    Removes all user's notifications.
    */
    console.log("clearNotifications() function hit.");
    let user = this.userService.getUserName();
    this.userService.clearUserNotifications(user);
    // TODO: Remove notifications from the list
  }

  openNotification(notification, notificationCount) {

    console.log("notification object: ");
    console.log(notification);

    // this.bottomSheet.open(NotificationDetails, {
    const dialogRef = this.dialog.open(NotificationDetails, {
      width: '50%',
      data: {
        notificationObj: notification,
        notificationCount: notificationCount
      }
    });

    // dialogRef.afterClosed().subscribe(result => {
    //   console.log("dialog was closed");
    // });

  }

}



@Component({
  selector: 'notification-details',
  templateUrl: 'notification-details.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationDetails {

  // addingNote: boolean = false;
  // preAddNote: boolean = true;  // Add btn before loading Add/Cancel/Textbox content

  constructor(
    // @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
  }



}