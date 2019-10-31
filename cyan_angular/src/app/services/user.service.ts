import { Injectable } from '@angular/core';
import { Observable, of} from 'rxjs';

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
    locations : [] 
  };
  response: any = null;

  constructor(private downloader: DownloaderService) { }

  loginUser(username: string, password: string) {
    this.downloader.userLogin(username, password).subscribe((details: any) => {
      this.currentAccount = null;
      this.currentAccount = details;
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
          this.response = response;
        }
        else{
          this.currentAccount.user.username = response['username'];
          this.currentAccount.user.email = response['email'];
          this.currentAccount.locations = [];
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

export class Account {
  user: User;
  locations: UserLocations[];
}
