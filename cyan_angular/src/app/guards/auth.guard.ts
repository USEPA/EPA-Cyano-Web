import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';

import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
  	private authService: AuthService, private router: Router
  ) {}
  canActivate(): boolean {
    if (!this.authService.isAuthenticated()) {
      // Redirects to login page
      this.authService.logout({'error': "User authentication expired"});
      return false;
    }
    return true;
  }
}