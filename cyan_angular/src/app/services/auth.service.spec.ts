import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { EnvService } from './env.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {

	let service: AuthService;
	let testAuthError = {
		error: 'test error message',
		userLoggedIn: true
	};
	let mockEnvService = {
		config: {
			baseServerUrl: 'http://testurl/'
		}
	};
	
  beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
			providers: [
				AuthService,
				{
					provide: EnvService,
					useValue: mockEnvService
				}
			]
		});
		service = TestBed.get(AuthService);
  });

  it('should be created', () => {
		expect(service).toBeTruthy();
  });

  it('should test checkUserAuthentication() - user authenticated', () => {
		const invalidToken = "someInvalidToken";
		localStorage.setItem('auth_token', invalidToken);
		expect(service.checkUserAuthentication()).not.toBe(true);
	});

  it('should test isAuthenticated()', () => {
  	let tokenSpy = spyOn(service, 'validateToken')
  		.and.returnValue(true);

  	service.isAuthenticated();

  	expect(tokenSpy).toHaveBeenCalled();
  });

  it('should test validateToken - invalidates a token', () => {
  	const invalidToken = "someInvalidToken";
  	expect(service.validateToken(invalidToken)).not.toBe(true);
  });

  it('should test setSession', () => {
  	const testToken = 'Bearer atesttoken';

  	service.setSession(testToken);

  	expect(localStorage.getItem('auth_token')).toMatch(testToken.split("Bearer ")[1]);
  });

  it('should test getSession', () => {
  	const testToken = 'atesttoken';
  	localStorage.setItem('auth_token', testToken);

  	let result = service.getSession(testToken);

  	expect(result).toMatch(testToken);
  });

  it('should test logout()', () => {
  	service.logout(testAuthError);

  	expect(service.authError.error).toMatch(testAuthError.error);
  });

  it('should test refresh() - unauthenticated', () => {
  	let tokenSpy = spyOn(service, 'isAuthenticated')
  		.and.returnValue(false);

  	let result = service.refresh();

  	expect(result).toBeUndefined();
  });

  it('should test refresh()', () => {
  	spyOn(service, 'isAuthenticated')
  		.and.returnValue(true);
  	let httpSpy = spyOn<any>(service['http'], 'get')
  		.and.returnValue(of({status: 'success'}));

  	service.refresh();

  	expect(httpSpy).toHaveBeenCalled();
  });

  it('should test sendResetEmail', () => {
  	const resetEmail = 'test@test.test';
  	let httpSpy = spyOn<any>(service['http'], 'post')
  		.and.returnValue({status: 'success'});

  	service.sendResetEmail(resetEmail);

  	expect(httpSpy).toHaveBeenCalled();
  });

  it('should test resetPassword() - unauthenticated', () => {
  	const newPassword = 'newtestpassword';
  	let tokenSpy = spyOn(service, 'checkUserAuthentication')
  		.and.returnValue(false);

  	let result = service.resetPassword(newPassword);

  	expect(result).toBeUndefined();
  });

  it('should test resetPassword', () => {
  	const newPassword = 'newtestpassword';
  	let tokenSpy = spyOn(service, 'checkUserAuthentication')
  		.and.returnValue(true);
  	let httpSpy = spyOn<any>(service['http'], 'put')
  		.and.returnValue({status: 'success'});

  	service.resetPassword(newPassword);

  	expect(httpSpy).toHaveBeenCalled();
  });

  it('should test emailIsValid() - invalid email', () => {
  	const email = "invalidEmailAddress";
  	expect(service.emailIsValid(email)).not.toBe(true);
  });


});
