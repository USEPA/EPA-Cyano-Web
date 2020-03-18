import { Injectable, Inject, Component } from '@angular/core';
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA } from '@angular/material';
import * as moment from "moment";
import { Subject } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';



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
    private router: Router
  ) { }

  public checkUserAuthentication(): boolean {
    // Checks if token is valid before making requests:
    if (!this.isAuthenticated()) {
      this.logout({'error': "User session has expired."});
      return false;
    }
    else {
      return true;
    }
  }

  public isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    return !this.jwtHelper.isTokenExpired(token);
  }
        
  public setSession(authResult) {
    if (authResult.includes("Bearer ")) {
      authResult = authResult.split(" ")[1];
    }
    localStorage.setItem('auth_token', authResult);
  }

  public getSession(authResult) {
    return localStorage.getItem('auth_token');
  }        

  logout(errorMessage: object) {
    localStorage.removeItem('auth_token');
    this.authError.userLoggedIn = false;
    this.authError.error = errorMessage['error'];
    this.authSubject.next(this.authError);  // publishes user login state
  }
  
}



class AuthError {
  userLoggedIn: boolean;
  error: string;
}