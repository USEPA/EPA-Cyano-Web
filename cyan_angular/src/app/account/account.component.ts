import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { User, UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { LocationService } from '../services/location.service';

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

  public userLoggedIn: Boolean = false;
  hidePassword: Boolean = true;

  username: string = null;
  password: string = null;

  currentUser: User = null;
  loginSub: Subscription = null;
  authSub: Subscription = null;
  firstLoad: boolean = true;

  loggingOut: boolean = false;

  errorMessage: string = "";  // error messages for login page

  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    private userService: UserService,
    private authService: AuthService,
    private locationService: LocationService
  ) {}

  ngOnInit() {
    let self = this;
    self.requestUser();
    self.userAuthListener();
    this.activeRoute.params.subscribe((params) => {
        if (params['error'] != undefined) {
          self.errorMessage = params.error;  // catches authorization error message
        }
        if (params['loggingOut'] != undefined) {
          this.loggingOut = params.loggingOut;  // shows logout button
        }
    });
  }

  userAuthListener(): void {
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
    this.authSub = this.authService.userLoginState.subscribe( (authError) => {
      if (authError == null) {
        return;
      }
      if (authError.userLoggedIn != null) {
        this.userLoggedIn = authError.userLoggedIn;
      }
      if (authError.userLoggedIn === false) {
        this.performLogoutRoutine(authError);
      }
    });
  }

  performLogoutRoutine(authError): void {
    this.userLoggedIn = false;
    this.currentUser = null;
    this.loggingOut = false;
    this.username = "";
    this.password = "";
    this.locationService.clearUserData();
    this.userService.logoutUser();
    this.locationService.loadUser();  // initiates user login loop
    this.router.navigate(['/account', {error: authError.error}]);
  }

  loginUser(): void {
    this.userService.loginUser(this.username, this.password);
    let self = this;
    setTimeout(function() {
      self.errorMessage = "";
      self.requestUser();
    }, 1200);
  }

  requestUser(): void {
    let self = this;
    if (this.loginSub) {
      this.loginSub.unsubscribe();
    }
    this.loginSub = this.userService.getUser().subscribe((user: any) => {
      if (user != null) {
        console.log(user);
        console.log(1);
        if (user.hasOwnProperty('error')) {
          console.log(2);
          setTimeout(function() {
            self.errorMessage = "Invalid username and/or password.";
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
          if(response.status == "failure"){
            console.log(response.status);
            setTimeout(function() {
              self.setRegisterMessage('Email adress already taken.');
            }, 300);
          } else {
              self.registerForm = false;
              self.username = self.registerUsername;
              self.password = self.registerPassword;
              self.loginUser();
            }
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
      this.errorMessage = "";
      this.router.navigate(['']);
    } else {
      this.errorMessage = "Please login to use the CyAN web app.";
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
