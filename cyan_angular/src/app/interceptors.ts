import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import 'rxjs/add/operator/do';
import { switchMap, filter, take } from 'rxjs/operators';
import { 
	HttpRequest,
	HttpResponse,
	HttpHandler,
	HttpEvent,
	HttpInterceptor,
	HttpErrorResponse
} from '@angular/common/http';

import { AuthService } from './services/auth.service';



function addToken(request: HttpRequest<any>, token: string) {
	return request.clone({
		setHeaders: {
			'Authorization': `Bearer ${token}`
		}
	});
}



@Injectable()
export class AuthInterceptor implements HttpInterceptor {
	/*
	Interceptor checks if token exists, and if so, adds it
	to the request's Authorization header before going to the backend.
	*/

	nonAuthUrls: string[] = ["cyan.epa.gov", "/cyan/app/api/user", "/cyan/app/api/user/register"];  // request urls that don't need auth (e.g., external requests)

	constructor (
		private authService: AuthService
	) {}

	intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		const auth_token = localStorage.getItem('auth_token');
		let isNonAuthUrl = this.nonAuthUrls.findIndex(url => req.url.includes(url)) > -1;
		if (isNonAuthUrl) {
			// console.log("Making non auth request, no need to add token.");
			return next.handle(req);
		}
		else if (auth_token && this.authService.isAuthenticated()) {
			// console.log("auth interceptor - token exists.");
			const cloned = addToken(req, auth_token);
			return next.handle(cloned);
		}
		else if (auth_token && !this.authService.isAuthenticated()) {
			// console.log("interceptors AuthInterceptor expired token triggered.");
			this.authService.logout({'error': "Session has expired."});
			return;	
		}
		else {
			// console.log("auth interceptor - token does not exist.");
			return next.handle(req);
		}
	}
}



@Injectable()
export class JwtInterceptor implements HttpInterceptor {
	/*
	Interceptor checks HTTP responses for authorization
	error (401), logs user out via auth.service if unauthorized
	(must login to obtain an authorization token).
	*/

	constructor (
		private authService: AuthService
	) {};

	intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		return next.handle(request).do((event: HttpEvent<any>) => {
			if (event instanceof HttpResponse) {
				// A successful response (200)
				const auth_token = event.headers.get('Authorization');
				if (auth_token) {
					// Reset the token in localStorage here since it's valid
					// console.log("interceptors JwtInterceptor renewing token.");
					this.authService.setSession(auth_token);
				}
			}
		},
		(err: any) => {
			if (err instanceof HttpErrorResponse) {
				if (err.status === 401) {
					this.authService.logout(err.error);  // logs out unauthenticated user, redirects to login route
				}
			}
		});
	}

}