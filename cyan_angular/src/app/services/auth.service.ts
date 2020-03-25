import { Injectable, Inject, Component } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { environment } from '../../environments/environment';



@Injectable()
export class AuthService {

  authError: AuthError = {
    userLoggedIn: false,
    error: ""
  }

  private baseServerUrl: string = environment.baseServerUrl;  // see src/environments for this value

  private authSubject =  new Subject<AuthError>();
  userLoginState = this.authSubject.asObservable();

  private jwtHelper = new JwtHelperService();

  constructor(
    private router: Router,
    private http: HttpClient
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
    */
    const token = localStorage.getItem('auth_token');
    return !this.jwtHelper.isTokenExpired(token);
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
    let url = this.baseServerUrl + 'refresh';
    return this.http.get(url).subscribe();
  }
  
}



class AuthError {
  userLoggedIn: boolean;
  error: string;
}