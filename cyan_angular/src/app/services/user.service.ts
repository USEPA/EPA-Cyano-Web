import { Injectable } from '@angular/core';
import { Observable, of, Subscription, Subject } from 'rxjs';

import { DownloaderService } from './downloader.service';


@Injectable({
  providedIn: 'root'
})
export class UserService {

  currentAccount: Account = {
    user : {
      username: "",
      email: ""
    },
    locations : [],
    notifications: []
  };
  response: any = null;

  private allNotificationsSource = new Subject<UserNotifications[]>();  // obserable Notifications[] sources
  allNotifications$ = this.allNotificationsSource.asObservable();  // observable Notifications[] streams

  constructor(private downloader: DownloaderService) { }

  loginUser(username: string, password: string) {
    this.downloader.userLogin(username, password).subscribe((details: Account) => {
      console.log("(user.service.ts) Logging in user.");
      this.currentAccount = null;
      this.currentAccount = details;
      this.allNotificationsSource.next(details.notifications);  // pushes user notifications to subscriber(s)
    });
  }

  registerUser(username: string, email: string, password: string) {
    let self = this;
    this.downloader.registerUser(username, email, password).subscribe(response => {
      if(response.hasOwnProperty("status")){
        if(response['status'] == "success"){
          this.currentAccount.user.username = response['username'];
          this.currentAccount.user.email = response['email'];
          this.currentAccount.locations = [];
          this.currentAccount.notifications = [];
          this.response = response;
        }
        else{
          this.currentAccount.user.username = response['username'];
          this.currentAccount.user.email = response['email'];
          this.currentAccount.locations = [];
          this.currentAccount.notifications = [];
        }
      }
      else{
        this.response = response;
      }
    });
  }

  getResponse(): Observable<any> {
    return of(this.response);
  }

  getUserName(): string {
    return this.currentAccount.user.username;
  }

  getUserDetails(): Observable<User> {
    return of(this.currentAccount.user)
  }

  getUser(): Observable<any> {
    return of(this.currentAccount);
  }

  getUserLocations(): Observable<UserLocations[]> {
    return of(this.currentAccount.locations);
  }

  updateUserNotifications(username: string, id: number) {
    /*
    Updates user's notification, e.g., is_new set to false if clicked.
    */
    this.downloader.updateNotification(username, id);
    let _notifications = this.currentAccount.notifications.map(item => {
      // Update notification's is_new bool to false.
      if (item[1] !== id) {
        return item;
      }
      item[5] = 0;
      return item;
    });
    // TODO: Set notifications in currentAccount?
    this.allNotificationsSource.next(_notifications);  // push updated notifications
  }

  clearUserNotifications(username: string) {
    /*
    Clears user's notifications.
    */
    this.downloader.clearUserNotifications(username);
    // Update user's notifications array to a new/blank array?
    this.currentAccount.notifications = [];
    this.allNotificationsSource.next(this.currentAccount.notifications);
  }

}

export class User {
  username: string;
  email: string;
}

export class UserLocations {
  owner: string;
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  marked: string;
  notes: string;
}

export class UserNotifications {
  id: number;
  date: string;
  subject: string;
  body: string;
  is_new: boolean;
}

export class Account {
  user: User;
  locations: UserLocations[];
  notifications: UserNotifications[];
}
