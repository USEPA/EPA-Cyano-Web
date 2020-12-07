import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {

	let service: AuthService;
	
  beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
			providers: [AuthService]
		});
		service = TestBed.get(AuthService);
  });

  it('should be created', () => {
		expect(service).toBeTruthy();
  });

  it('should be invalid email', () => {
  	const email = "invalidEmailAddress";
  	expect(service.emailIsValid(email)).not.toBe(true);
  });

  it('should invalidate a token', () => {
  	const invalidToken = "someInvalidToken";
  	expect(service.validateToken(invalidToken)).not.toBe(true);
  });

	it('should check user authentication', () => {
		const invalidToken = "someInvalidToken";
		localStorage.setItem('auth_token', invalidToken);
		expect(service.checkUserAuthentication()).not.toBe(true);
	});

});