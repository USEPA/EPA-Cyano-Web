import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { User, UserService } from '../services/user.service';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {
  // TODO: Read from config file
  devState: string = 'Alpha';
  version: number = 0.1;
  lastUpdate: string = '02/11/2019';

  registerForm: Boolean = false;
  registerUsername: string = null;
  registerEmail: string = null;
  registerPassword: string = null;
  hideRegisterPassword: Boolean = true;
  registerPasswordCheck: string = null;
  hideRegisterPasswordCheck: Boolean = true;

  registerSub: Subscription = null;

  description: string =
    'This experimental web application provides provisional satellite derived measures of cyanobacteria, which may contain errors and should be considered a research tool. Users should refer to the app help menu for more details. The focus of this application is to provide cyanobacteria measure for larger lakes and reservoirs within the continental US. Data products are 7-day maximum cyanobacteria measures updated weekly.';

  userLoggedIn: Boolean = false;
  hidePassword: Boolean = true;

  username: string = null;
  password: string = null;

  currentUser: User = null;
  loginSub: Subscription = null;
  firstLoad: boolean = true;

  constructor(private router: Router, private userService: UserService) {}

  ngOnInit() {
    let self = this;
    setTimeout(function() {
      self.requestUser();
    }, 100);
  }

  loginUser(): void {
    this.userService.loginUser(this.username, this.password);
    let self = this;
    setTimeout(function() {
      self.setLoginMessage('');
      self.requestUser();
    }, 1200);
  }

  requestUser(): void {
    let self = this;
    if (this.loginSub) {
      this.loginSub.unsubscribe();
    }
    this.loginSub = this.userService.getUser().subscribe((user: any) => {
      setTimeout(function() {
        self.setLoginMessage('');
      }, 100);
      if (user != null) {
        console.log(user);
        console.log(1);
        if (user.hasOwnProperty('error')) {
          console.log(2);
          setTimeout(function() {
            self.setLoginMessage('Invalid username and/or password.');
          }, 300);
        } else if (user.user.username === '' || user.user.username === undefined) {
          console.log(3);
          if (self.firstLoad) {
            self.firstLoad = false;
          } else {
            setTimeout(function() {
              self.requestUser();
            }, 600);
          }
        } else {
          console.log(4);
          this.userLoggedIn = true;
          this.currentUser = user;
        }
      } else {
        console.log(5);
        setTimeout(function() {
          self.requestUser();
        }, 600);
      }
    });
  }

  registerUser(): void {
    if (this.validateForm()) {
      this.userService.registerUser(this.registerUsername, this.registerEmail, this.registerPassword);
      this.getRegisteredUser();
    }
  }

  getRegisteredUser(): void {
    let self = this;
    if (this.registerSub) {
      this.registerSub.unsubscribe();
    }
    this.registerSub = this.userService.getResponse().subscribe(response => {
      setTimeout(function() {
        if (self.registerForm) {
          self.setRegisterMessage('');
        }
      }, 100);
      if (response != null) {
        if (response.hasOwnProperty('status')) {
          self.registerForm = false;
          self.username = self.registerUsername;
          self.password = self.registerPassword;
          self.loginUser();
        } else {
          setTimeout(function() {
            self.setRegisterMessage('User name already taken.');
          }, 300);
        }
      } else {
        setTimeout(function() {
          self.getRegisteredUser();
        }, 600);
      }
    });
  }

  exitAccount() {
    if (this.userLoggedIn) {
      this.setLoginMessage('');
      this.router.navigate(['']);
    } else {
      this.setLoginMessage('Please login to use the CyAN web app.');
    }
  }

  setLoginMessage(message: string): void {
    if (!this.registerForm) {
      document.getElementsByClassName('login-message')[0].innerHTML = message;
    }
  }

  setRegisterMessage(message: string): void {
    if (this.registerForm) {
      document.getElementsByClassName('register-message')[0].innerHTML = message;
    }
  }

  validateForm(): Boolean {
    let self = this;
    if (this.registerUsername == '' || this.registerUsername == undefined || this.registerUsername.length < 4) {
      setTimeout(function() {
        self.setRegisterMessage('Username must be 4 character or more.');
      }, 100);
      return false;
    }
    if (this.registerPassword != this.registerPasswordCheck) {
      setTimeout(function() {
        self.setRegisterMessage('Passwords do not match.');
      }, 100);
      return false;
    }
    if (this.registerPassword.length < 6 || this.registerPassword.length > 12) {
      setTimeout(function() {
        self.setRegisterMessage('Password must contain between 6 and 12 characters.');
      }, 100);
    }
    return true;
  }
}
