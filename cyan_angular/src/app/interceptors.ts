import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import 'rxjs/add/operator/do';
import { 
	HttpRequest,
	HttpResponse,
	HttpHandler,
	HttpEvent,
	HttpInterceptor,
	HttpErrorResponse
} from '@angular/common/http';

import { AuthService } from './services/auth.service';



@Injectable()
export class AuthInterceptor implements HttpInterceptor {
	/*
	Interceptor checks if token exists, and if so, adds it
	to the request's Authorization header before going to the backend.
	*/
	intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		const auth_token = localStorage.getItem('auth_token');
		if (auth_token) {
			console.log("auth interceptor - token exists.");
			const cloned = req.clone({
				headers: req.headers.set("Authorization",
					"Bearer " + auth_token)
			});
			return next.handle(cloned);
		}
		else {
			console.log("auth interceptor - token does not exist.");
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
				// A successful response
			}
		},
		(err: any) => {
			if (err instanceof HttpErrorResponse) {
				if (err.status === 401) {
					console.log("jwt interceptor - 401 http error reponse.");
					this.authService.logout(err.error);  // logs out unauthenticated user, redirects to login route
				}
			}
		});
	}
}