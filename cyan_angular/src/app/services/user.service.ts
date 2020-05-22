import { Injectable } from '@angular/core';
import { Observable, of, Subscription, Subject } from 'rxjs';

import { DownloaderService } from './downloader.service';
import { AuthService } from './auth.service';
import {UserSettings} from "../models/settings";


@Injectable({
  providedIn: 'root'
})
export class UserService {

  currentAccount: Account = {
    user : {
      username: "",
      email: "",
      auth_token: ""
    },
    locations : [],
    notifications: [],
    settings: new UserSettings()
  };
  response: any = null;

  private allNotificationsSource = new Subject<UserNotifications[]>();  // obserable Notifications[] sources
  allNotifications$ = this.allNotificationsSource.asObservable();  // observable Notifications[] streams

  constructor(
    private downloader: DownloaderService,
    private authService: AuthService
  ) { }

  initializeCurrentAccount(): void {
    this.currentAccount = {
      user : {
        username: "",
        email: "",
        auth_token: ""
      },
      locations : [],
      notifications: [],
      settings: new UserSettings()
    };
  }

  loginUser(username: string, password: string) {
    this.downloader.userLogin(username, password).subscribe((details: Account) => {
      if (!('error' in details)) {
        this.currentAccount = details;
        this.currentAccount.locations.forEach(location => {
          location.notes = Array.isArray(location.notes) ? location.notes : JSON.parse(location.notes);
        });
        this.allNotificationsSource.next(details.notifications);  // pushes user notifications to subscriber(s)
        this.authService.setSession(details.user.auth_token);
      }
      else {
        this.currentAccount['error'] = details['error'];
      }
    });
  }

  logoutUser() {
    /*
    Clears current account data, locations, notifcations, etc.
    */
    this.initializeCurrentAccount();  // clears currentAccount object
    this.allNotificationsSource.next([]);  // clears notifications source
  }

  registerUser(username: string, email: string, password: string) {
    let self = this;
    this.downloader.registerUser(username, email, password).subscribe(response => {
      if(response.hasOwnProperty("status")){
        if(response['status'] == "success" || response['status'] == "failure"){
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

  getUserSettings(): UserSettings {
    return this.currentAccount.settings;
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

  updateUserSettings(settings: UserSettings) {
    return this.downloader.updateUserSettings(settings);
  }

  clearUserNotifications(username: string) {
    /*
    Clears user's notifications.
    */
    this.downloader.clearUserNotifications(username);
    this.currentAccount.notifications = [];
    this.allNotificationsSource.next(this.currentAccount.notifications);
  }

}

export class User {
  username: string;
  email: string;
  auth_token: string;
}

export class UserLocations {
  owner: string;
  id: number;
  name: string;
  type: number;
  latitude: number;
  longitude: number;
  marked: boolean;
  compare: boolean;
  notes: object[];
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
  settings: UserSettings;
}
