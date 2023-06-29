import { Injectable, Inject, Component } from '@angular/core';
import { Subject } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { EnvService } from '../services/env.service';



@Injectable()
export class AuthService {

  authError: AuthError = {
    userLoggedIn: false,
    error: ""
  }
  
  private authSubject =  new Subject<AuthError>();
  userLoginState = this.authSubject.asObservable();

  private jwtHelper = new JwtHelperService();

  minPasswordLength: number = 8;
  maxPasswordLength: number = 32;
  passwordStrength: RegExp = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[~!@#$%=+<>/?^&*]).{8,}/;
  usernameMinLength: number = 4;
  usernameMaxLength: number = 36;

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
    return this.http.get(url, this.envService.getHeaders()).subscribe();
  }

  sendResetEmail(resetEmail: string) {
    /*
    Makes request to send email for password reset.
    */
    let url = this.envService.config.baseServerUrl + 'reset';
    let body = { email: resetEmail };
    return this.http.post(url, body, this.envService.getHeaders());
  }

  resetPassword(newPassword: string) {
    /*
    Makes request to reset user's password.
    */
    if (!this.checkUserAuthentication()) { return; }
    let url = this.envService.config.baseServerUrl + 'reset';
    let body = { newPassword: newPassword };
    return this.http.put(url, body, this.envService.getHeaders());
  }

  emailIsValid (email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  validatePassword(password: string, confirmPassword: string): any {
    if (password != confirmPassword) {
      return {'valid': false, 'message': 'Passwords do not match.'}
    }
    else if (
      password.length < this.minPasswordLength ||
      password.length > this.maxPasswordLength
    ) {
      return {
        'valid': false,
        'message': 'Password must contain between ' + this.minPasswordLength + ' and ' + this.maxPasswordLength + ' characters.'
      }
    }
    else if (this.passwordStrength.test(password) !== true) {
      return {
        'valid': false,
        'message': 'Password must contain at least 1 digit (0-9), at least 1 symbol (e.g., ~, !, @, #, $, %, =, +, <, >, /, ?, ^, &, *), at least 1 UPPERCASE English letter (A-Z), and at least 1 lowercase English letter (a-z)'
      }
    }
    else {
      return {
        'valid': true,
        'message': ''
      }
    }

  }

  validateUsername(username: string): any {
    if (
      username == '' ||
      username == undefined ||
      username.length < this.usernameMinLength ||
      username.length > this.usernameMaxLength
    ) {
        return {
          'valid': false,
          'message': 'Username must be ' + this.usernameMinLength + ' and ' + this.usernameMaxLength + ' characters.'
        }
    }
    else if (this.isAlphaNumeric(username) !== true) {
      return {
          'valid': false,
          'message': 'Username must only contain alphanumeric characters (i.e., a-z/A-Z/0-9)'
        }
    }
    else {
      return {
        'valid': true,
        'message': ''
      }
    }
  }

  isAlphaNumeric(str: string): boolean {
    let code, i, len;
    if (str.length < 1) {
      return false;
    }
    for (i = 0, len = str.length; i < len; i++) {
      code = str.charCodeAt(i);
      if (!(code > 47 && code < 58) && // numeric (0-9)
          !(code > 64 && code < 91) && // upper alpha (A-Z)
          !(code > 96 && code < 123)) { // lower alpha (a-z)
        return false;
      }
    }
    return true;
  }
  
}



export class AuthError {
  userLoggedIn: boolean;
  error: string;
}