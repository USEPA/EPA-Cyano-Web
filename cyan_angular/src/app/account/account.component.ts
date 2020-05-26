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

  registerForm: boolean = false;
  registerUsername: string = null;
  registerEmail: string = null;
  registerPassword: string = null;
  hideRegisterPassword: boolean = true;
  registerPasswordCheck: string = null;
  hideRegisterPasswordCheck: boolean = true;

  description: string =
    'This experimental web application provides provisional satellite derived measures of cyanobacteria, which may contain errors and should be considered a research tool. Users should refer to the app help menu for more details. The focus of this application is to provide cyanobacteria measure for larger lakes and reservoirs within the continental US. Data products are 7-day maximum cyanobacteria measures updated weekly.';

  public userLoggedIn: boolean = false;
  hidePassword: boolean = true;

  username: string = null;
  password: string = null;

  currentUser: User = null;
  loginSub: Subscription = null;
  authSub: Subscription = null;

  loggingOut: boolean = false;

  errorMessage: string = "";  // error messages for login page
  resetMessage: string = "";

  resetForm: boolean = false;
  loginForm: boolean = true;

  resetEmail: string = "";
  allowReset: boolean = true;

  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    private userService: UserService,
    private authService: AuthService,
    private locationService: LocationService
  ) {
  }

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

  showResetView(): void {
    this.resetForm = true;
    this.loginForm = false;
    this.registerForm = false;
    this.resetMessage = "";
    this.allowReset = true;
  }

  sendResetEmail(): void {
    /*
    Makes request to backend for sending user email
    with link and reset token.
    */
    this.errorMessage = "";
    this.resetMessage = "";
    if (!this.authService.emailIsValid(this.resetEmail)) {
      this.errorMessage = "Email is invalid";
      return;
    }
    this.authService.sendResetEmail(this.resetEmail).subscribe((response) => {
      if ('error' in response) {
        this.errorMessage = response['error'];
      } else if ('status' in response) {
        this.resetMessage = response['status'];
        this.allowReset = false;
      }
    });
  }

  userAuthListener(): void {
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
    this.authSub = this.authService.userLoginState.subscribe((authError) => {
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

  requestUser(): void {
    let self = this;
    if (this.loginSub) {
      this.loginSub.unsubscribe();
    }
    this.loginSub = this.userService.getUser().subscribe((user: any) => {
        if (user != null && user.user.username) {
          self.userLoggedIn = true;
          self.currentUser = user;
        } else {
          self.userLoggedIn = false;
          self.currentUser = null;
        }
      }
    );
  }

  loginUser(): void {
    let self = this;

    this.userService.loginUser(this.username, this.password).subscribe(
      (user: any) => {
        // successful login
        self.userLoggedIn = true;
        self.currentUser = user;
        self.errorMessage = "";
        self.userService.setUserDetails(user);
        self.locationService.loadUser();
      },
      errorResponse => {
        // error happened, show error in page
        self.userLoggedIn = false;
        self.currentUser = null;
        if (errorResponse.error) {
          self.errorMessage = errorResponse.error.error;
        } else {
          self.errorMessage ="Login failed"
        }
      }
    );
  }

  registerUser(): void {
    let self = this;
    if (this.validateForm()) {
      this.userService.registerUser(this.registerUsername, this.registerEmail, this.registerPassword).subscribe(
        response => {
          // user successfully registered, log the user in
          self.registerForm = false;
          self.username = self.registerUsername;
          self.password = self.registerPassword;
          self.loginUser();
        },
        errorResponse => {
          // error happened, show error in page
          if (errorResponse.error) {
            self.setRegisterMessage(errorResponse.error.error);
          } else {
            self.setRegisterMessage("Registration failed")
          }
        }
      );
    }
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
      self.setRegisterMessage('Username must be 4 character or more.');
      return false;
    }
    if (this.registerPassword != this.registerPasswordCheck) {
      self.setRegisterMessage('Passwords do not match.');
      return false;
    }
    if (this.registerPassword.length < 6 || this.registerPassword.length > 24) {
      self.setRegisterMessage('Password must contain between 6 and 24 characters.');
      return false
    }
    return true;
  }
}
