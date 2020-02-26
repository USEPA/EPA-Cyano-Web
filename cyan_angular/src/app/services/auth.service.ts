import { Injectable, Inject, Component } from '@angular/core';
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA } from '@angular/material';
import * as moment from "moment";
import { BehaviorSubject } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';



@Injectable()
export class AuthService {

  authError: AuthError = {
    userLoggedIn: false,
    error: ""
  }

  private authSubject =  new BehaviorSubject<AuthError>(null);
  userLoginState = this.authSubject.asObservable();

  private jwtHelper = new JwtHelperService();

  constructor(
    private router: Router
  ) { }

  public isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    return !this.jwtHelper.isTokenExpired(token);
  }
        
  public setSession(authResult) {
    localStorage.setItem('auth_token', authResult.idToken);
  }          

  logout(errorMessage: object) {
    console.log("auth.service logout() called");
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