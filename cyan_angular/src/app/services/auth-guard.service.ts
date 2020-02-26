import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';

import { AuthService } from './auth.service';

@Injectable()
export class AuthGuardService implements CanActivate {
  constructor(
  	private authService: AuthService, private router: Router
  ) {}
  canActivate(): boolean {
    if (!this.authService.isAuthenticated()) {
    	console.log("auth-guard service - user not authenticated.")
      this.authService.logout({'error': "User authentication expired"});
      return false;
    }
    console.log("auth-guard service - user authenticated.");
    return true;
  }
}