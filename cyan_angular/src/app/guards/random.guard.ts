import { Injectable } from '@angular/core';
import { CanActivate, CanLoad, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
	providedIn: 'root'
})
export class RandomGuard implements CanActivate, CanLoad {

	constructor(private authService: AuthService, private router: Router) { }

	canActivate() {
		return this.canLoad();
	}

	canLoad() {
		if (!this.authService.isAuthenticated()) {
			// Redirects to login page
      this.authService.logout({'error': "User authentication expired"});
      return false;
		}
		return this.authService.isAuthenticated();
	}
}