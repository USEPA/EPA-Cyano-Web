import { Component, OnInit, Inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { Location } from '../models/location';
// import { LocationService } from '../services/location.service';
// import { MapService } from '../services/map.service';
import { UserService } from '../services/user.service';
import { DownloaderService } from '../services/downloader.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {

	new_notifications = [];  // only new notifications
  all_notifications = [];  // new and read notifications
  display_notifications = [];  // notifications being displayed

  new_notifications_counter: number = 0;

  current_notification_index: number = 0;

  showNotification: boolean = false;  // shows notification detail

	notificationSubscription: Subscription;

  constructor(
		private userService: UserService,
    private dialog: MatDialog,
    private authService: AuthService
  ) { }

  ngOnInit() {

    // if (!this.authService.checkUserAuthentication()) { return; }

    this.all_notifications = this.userService.currentAccount.notifications;
    this.new_notifications = this.userService.currentAccount.notifications.filter(x => x[5] == true);
    this.display_notifications = this.all_notifications;
    this.new_notifications_counter = this.new_notifications.length;

    this.current_notification_index = 0;

		this.notificationSubscription = this.userService.allNotifications$.subscribe(
			notifications => {
        // this.new_notifications = notifications;
        this.all_notifications = notifications;
        this.new_notifications = notifications.filter(x => x[5] == true)
        this.new_notifications_counter = this.new_notifications.length;
			}
		);
  }

  ngOnDestroy() {
		this.notificationSubscription.unsubscribe();
  }

  toggleChecked(event) {
    if (event.checked == true) {
      // Only shows new notifications:
      this.display_notifications = this.new_notifications;
    }
    else {
      this.display_notifications = this.all_notifications;
    }
  }

  hasNotifications() {
  }

  notificationSelect(notification) {
  	/*
  	Check status of notification and set bool based on
  	is_new Notification attribute.
  	*/
    if (notification[5] == 1) {
      notification[5] = 0;  // sets is_new to false
      let owner = notification[0];
      let id = notification[1];
      // let notifications = this.userService.updateUserNotifications(owner, id);
      this.userService.updateUserNotifications(owner, id);
    }
    // Opens selected notification in bottom sheet:
    this.openNotification(notification, this.new_notifications_counter);
  }

  clearNotifications() {
    /*
    Removes all user's notifications.
    */
    if (!this.authService.checkUserAuthentication()) { return; }
    let user = this.userService.getUserName();
    this.userService.clearUserNotifications(user);
    this.new_notifications = [];
    this.all_notifications = [];
    this.display_notifications = [];

  }

  openNotification(notification, notificationCount) {
    if (!this.authService.checkUserAuthentication()) { return; }
    const dialogRef = this.dialog.open(NotificationDetails, {
      width: '50%',
      data: {
        notificationObj: notification,
        notificationCount: notificationCount,
        allNotifications: this.all_notifications
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

  current_notification_index: number = 0;

  constructor(
    public dialogRef: MatDialogRef<NotificationDetails>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private userService: UserService
  ) { }

  ngOnInit() {
    // Gets the index of the selected notification object
    let notificationId = this.data.notificationObj[1];
    this.current_notification_index = this.data.allNotifications.map(item => item[1]).indexOf(notificationId);
  }

  exit(): void {
    // Closes the notification detail
    this.dialogRef.close();
  }

  previousNotification(): void {
    this.current_notification_index = this.current_notification_index == 0 ? this.data.allNotifications.length - 1 : this.current_notification_index - 1;
    this.data.notificationObj = this.data.allNotifications[this.current_notification_index];
    this.updateUserNotifications(this.data.notificationObj);
  }

  nextNotification(): void {
    this.current_notification_index = this.current_notification_index == this.data.allNotifications.length - 1 ? 0 : this.current_notification_index + 1;
    this.data.notificationObj = this.data.allNotifications[this.current_notification_index];
    this.updateUserNotifications(this.data.notificationObj);
  }

  updateUserNotifications(notificationObj: any): void {
    let owner = notificationObj[0];
    let id = notificationObj[1];
    this.userService.updateUserNotifications(owner, id);
  }

}
