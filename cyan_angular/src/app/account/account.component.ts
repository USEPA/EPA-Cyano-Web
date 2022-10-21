import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Validators, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import { UserIdleService } from 'angular-user-idle';
import { User, Account, UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { LocationService } from '../services/location.service';
import {environment} from "../../environments/environment";
import { DialogComponent } from '../shared/dialog/dialog.component';
import { MarkerMapComponent } from '../marker-map/marker-map.component';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AccountComponent implements OnInit {
  // TODO: Read from config file
  devState: string = 'Beta';
  version: string = environment.appVersion;

  registerForm: boolean = false;
  registerUsername: string = null;
  registerEmail: string = null;
  registerPassword: string = null;
  hideRegisterPassword: boolean = true;
  registerPasswordCheck: string = null;
  hideRegisterPasswordCheck: boolean = true;

  public userLoggedIn: boolean = false;
  hidePassword: boolean = true;

  username: string = null;
  password: string = null;

  currentUser: Account = null;
  loginSub: Subscription = null;
  authSub: Subscription = null;

  userIdleTimerStartSub: Subscription = null;
  userIdleTimeoutSub: Subscription = null;
  userIdlePingSub: Subscription = null;

  loggingOut: boolean = false;

  errorMessage: string = "";  // error messages for login page
  resetMessage: string = "";

  resetForm: boolean = false;
  loginForm: boolean = true;

  resetEmail: string = "";
  allowReset: boolean = true;

  usernameMinLength: number = 4;
  usernameMaxLength: number = 36;

  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    private userService: UserService,
    private authService: AuthService,
    private userIdle: UserIdleService,
    private locationService: LocationService,
    private dialog: DialogComponent,
    private matDialog: MatDialog,
    private markerMap: MarkerMapComponent
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

  trackUserIdleTimout(): void {
    let self = this;
    // Start watching for user inactivity.
    this.userIdle.startWatching();

    // Start watching when user idle is starting.
    if (this.userIdleTimerStartSub) {
      this.userIdleTimerStartSub.unsubscribe()
    }
    this.userIdleTimerStartSub = this.userIdle.onTimerStart().subscribe((count) => {
        // show timeout count down
      if (count) {
        self.userService.currentAccount.user.sessionCountDown = self.userIdle.getConfigValue().timeout - count;
      }
      }
    );

    // Start watch when time is up.
    if (this.userIdleTimeoutSub) {
      this.userIdleTimeoutSub.unsubscribe();
    }
    this.userIdleTimeoutSub = this.userIdle.onTimeout().subscribe(() => {
        self.userService.logoutUser();
        self.performLogoutRoutine({'error': 'Session Expired'});
      }
    );

    // Refresh token
    if (this.userIdlePingSub) {
      this.userIdlePingSub.unsubscribe();
    }
    this.userIdlePingSub = this.userIdle.ping$.subscribe(() => {
      self.authService.refresh();
    });
  }

  stopTrackUserIdleTimout(): void {
    this.userIdle.stopWatching();
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
      this.resetEmail = '';
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
    this.stopTrackUserIdleTimout();
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

        // track user idle timeout, logout if expired
        this.trackUserIdleTimout();

        this.markerMap.getMostCurrentAvailableDate();  // loads most recent daily wb data layer

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
    this.validateForm();
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

  exitAccount() {
    if (this.userLoggedIn) {
      this.errorMessage = "";
      this.userIdle.resetTimer();
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

  validateForm(): void {
    let self = this;
    let validUsername = this.authService.validateUsername(this.registerUsername);
    let validPass = this.authService.validatePassword(this.registerPassword, this.registerPasswordCheck);
    if (validUsername['valid'] !== true) {
      self.dialog.handleError(validUsername['message']);
    }
    else if (validPass['valid'] !== true) {
      self.dialog.handleError(validPass['message']);
    }
    else if (!this.authService.emailIsValid(this.registerEmail)) {
      self.dialog.handleError('Email is invalid');
    }
  }

  displayWhatsNewPopup(): void {
    /*
    Uses dialog component to display what's new in a particular version.
    */

    // this.dialog.displayMessageDialog("<h1>Testing html elements in message</h1>");
    this.matDialog.open(WhatsNewDialog, {

    });

  }

}

@Component({
  selector: 'what-new-dialog',
  templateUrl: 'whats-new-dialog.html'
})
export class WhatsNewDialog {
  constructor(public dialogRef: MatDialogRef<WhatsNewDialog>) {}

  version: string = environment.appVersion;

  exit(): void {
    this.dialogRef.close();
  }

}
