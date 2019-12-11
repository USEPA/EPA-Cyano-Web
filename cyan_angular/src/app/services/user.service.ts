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
