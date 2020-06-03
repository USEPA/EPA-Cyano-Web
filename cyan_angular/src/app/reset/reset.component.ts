import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { UserService } from '../services/user.service';
import { LocationService } from '../services/location.service';
import { AuthService } from '../services/auth.service';

@Component({
	selector: 'app-reset',
	templateUrl: './reset.component.html',
	styleUrls: ['./reset.component.css']
})
export class ResetComponent implements OnInit {

	hidePassword: boolean = true;
	success: boolean = false;  // bool for successful reset

	newPassword: string = "";
	confirmPassword: string = "";

	resetMessage: string = "";
	messageColor: string = "black";

	emailAddress: string = "";

	constructor(
		private authService: AuthService,
		private activatedRoute: ActivatedRoute,
		private userService: UserService,
		private locationService: LocationService,
		private router: Router
	) { }

	ngOnInit() {

		this.activatedRoute.queryParams.subscribe((params) => {
			if (Object.keys(params).length != 1 || params['token'] == undefined) {
				// Invalid request if more than one param or if no 'token'
				this.authService.logout({'error': "Invalid reset request."});
				this.redirectToLogin("Invalid reset request.");
				return;
			}

			if (!this.authService.validateToken(params['token'])) {
				// Checks if token is valid
				this.authService.logout({'error': "Invalid reset token."});
				this.redirectToLogin("Invalid reset token.");
				return;
			}

			this.authService.setSession(params['token']);  // stores valid token in localStorage

		});

	}

	redirectToLogin(authError): void {
    this.router.navigate(['/account', {error: authError}]);
  }

  goToLogin(): void {
  	this.router.navigate(['/account'])
  }

	resetUserPassword(): void {
		if (!this.isValidForm()) {
			this.success = false;
			return;
		}

		// let response = this.authService.resetPassword(this.newPassword);
		this.authService.resetPassword(this.newPassword).subscribe((response) => {
			this.messageColor = "black";
			this.resetMessage = "Password has been reset."
			this.success = true;
		});

	}

	isValidForm(): boolean {
		if (this.newPassword != this.confirmPassword) {
			this.messageColor = "red";
			this.resetMessage = "Passwords do not match.";
			return false;
		}
		if (this.newPassword.length < 6 || this.newPassword.length > 24) {
			this.messageColor = "red";			
			this.resetMessage = "Password must contain between 6 and 24 characters.";
			return false;
		}
		this.resetMessage = "";
		return true;
	}

}
