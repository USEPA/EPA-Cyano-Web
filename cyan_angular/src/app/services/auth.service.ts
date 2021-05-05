import { Injectable, Inject, Component } from '@angular/core';
import { Subject } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { EnvService } from '../services/env.service';

import { headerOptions } from '../models/headers'; 



@Injectable()
export class AuthService {

  authError: AuthError = {
    userLoggedIn: false,
    error: ""
  }
  
  private authSubject =  new Subject<AuthError>();
  userLoginState = this.authSubject.asObservable();

  private jwtHelper = new JwtHelperService();

  constructor(
    private http: HttpClient,
    private envService: EnvService
  ) { }

  public checkUserAuthentication(): boolean {
    /*
    Checks if token is valid before making requests,
    logs out if not valid.
    */
    if (!this.isAuthenticated()) {
      this.logout({'error': "User session has expired."});
      return false;
    }
    else {
      return true;
    }
  }

  public isAuthenticated(): boolean {
    /*
    Checks if token is valid, returns bool.
    Optional 'token' input, otherwise uses 'auth_token' in localStorage.
    */
    let token = localStorage.getItem('auth_token');
    return this.validateToken(token);
  }

  validateToken(token) {
    try {
      return !this.jwtHelper.isTokenExpired(token);
    }
    catch (e) {
      return false;
    } 
  }
        
  public setSession(authResult) {
    /*
    Sets auth token in local storage.
    */
    if (authResult.includes("Bearer ")) {
      authResult = authResult.split(" ")[1];
    }
    localStorage.setItem('auth_token', authResult);
  }

  public getSession(authResult) {
    /*
    Gets auth token from local storage.
    */
    return localStorage.getItem('auth_token');
  }        

  logout(errorMessage: object) {
    /*
    Initiates logout routine.
    */
    localStorage.removeItem('auth_token');
    this.authError.userLoggedIn = false;
    this.authError.error = errorMessage['error'];
    this.authSubject.next(this.authError);  // publishes user login state
  }

  refresh() {
    /*
    Refreshes token for authenticated user.
    */
    if (!this.isAuthenticated()) { return; }
    let url = this.envService.config.baseServerUrl + 'refresh';
    return this.http.get(url, headerOptions).subscribe();
  }

  sendResetEmail(resetEmail) {
    /*
    Makes request to send email for password reset.
    */
    let url = this.envService.config.baseServerUrl + 'reset';
    let body = { email: resetEmail };
    return this.http.post(url, body, headerOptions);
  }

  resetPassword(newPassword) {
    /*
    Makes request to reset user's password.
    */
    if (!this.checkUserAuthentication()) { return; }
    let url = this.envService.config.baseServerUrl + 'reset';
    let body = { newPassword: newPassword };
    return this.http.put(url, body, headerOptions);
  }

  emailIsValid (email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
  
}



export class AuthError {
  userLoggedIn: boolean;
  error: string;
}