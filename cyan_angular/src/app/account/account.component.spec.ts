import { DebugElement } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { AuthService, AuthError } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { AccountComponent } from './account.component';
import { CyanMap } from '../utils/cyan-map';
import { User, Account } from '../services/user.service';

describe('AccountComponent', () => {
	
	let component: AccountComponent;
	let fixture: ComponentFixture<AccountComponent>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [RouterTestingModule, HttpClientModule,],
			declarations: [
				AccountComponent
			],
			providers: [
				AuthService,
				LoaderService,
				CyanMap
			]
		}).compileComponents();
		AccountComponent.prototype.ngOnInit = () => {};  // skips ngOnInit
		fixture = TestBed.createComponent(AccountComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should test validateForm() - blank user', () => {
		component.registerUsername = '';
		expect(component.validateForm()).toBeFalsy();
	});

	it('should test validateForm() - password mismatch', () => {
		component.registerPassword = "testPasswordDiff";
		component.registerPasswordCheck = "testPassword";
		expect(component.validateForm()).toBeFalsy();
	});

	it('should test validateForm() - password > 24 chars', () => {
		component.registerUsername = "testUser";
		component.registerPassword = "testPasswordGreaterThan24";
		component.registerPasswordCheck = "testPasswordGreaterThan24";
		expect(component.validateForm()).toBeFalsy();
	});

	it('should test validateForm() - password < 6 chars', () => {
		component.registerUsername = "testUser";
		component.registerPassword = "pass";
		component.registerPasswordCheck = "pass";
		expect(component.validateForm()).toBeFalsy();
	});

	it('should test validateForm() - success', () => {
		component.registerUsername = "testUser";
		component.registerPassword = "testPassword";
		component.registerPasswordCheck = "testPassword";
		expect(component.validateForm()).toBeTruthy();
	});

	it('should test setRegisterMessage()', () => {
		const testMessage: string = "this is a test";
		component.registerForm = true;
		fixture.detectChanges();  // detects component change above (registerForm=true)
		component.setRegisterMessage(testMessage);
		const regMessageDebug: DebugElement = fixture.debugElement;
		const regMessageElement: HTMLElement = regMessageDebug.nativeElement.querySelector('div.register-message');
		expect(regMessageElement.textContent).toMatch(testMessage);
	});

	it('should test exitAccount() - user not logged in', () => {
		const errorMessage: string = 'Please login to use the CyAN web app.';
		component.userLoggedIn = false;
		fixture.detectChanges();

		component.exitAccount();

		expect(component.errorMessage).toMatch(errorMessage);
	});

	it('should test exitAccount() - user logged in', () => {
		const errorMessage: string = '';
		component.userLoggedIn = true;
		component.currentUser = new Account();
		component.currentUser.user = new User();
		fixture.detectChanges();

		component.exitAccount();

		expect(component.errorMessage).toMatch(errorMessage);
	});

	it('should test registerUser() - valid form', () => {
		component.registerUsername = 'testuser';
		component.registerPassword = 'testpass';
		fixture.detectChanges();
		spyOn(component, 'validateForm').and.returnValue(true);
		spyOn<any>(component['userService'], 'registerUser').and.returnValue(
			of('mock response')
		);
		spyOn(component, 'loginUser');

		component.registerUser();

		expect(component.registerForm).toBeFalsy();
		expect(component.username).toMatch(component.registerUsername);
		expect(component.password).toMatch(component.registerPassword);
	});

	it('should test loginUser() - successful login', () => {
		let testUserAccount: Account = new Account();
		testUserAccount.user = new User();
		testUserAccount.user.username = 'testuser';
		spyOn<any>(component['userService'], 'loginUser').and.returnValue(
			of(testUserAccount)
		);
		spyOn<any>(component['userService'], 'setUserDetails');
		spyOn<any>(component['locationService'], 'loadUser');
		spyOn(component, 'trackUserIdleTimout');
		
		component.loginUser();

		expect(component.userLoggedIn).toBe(true);
		expect(component.errorMessage).toMatch('');
		expect(component.currentUser.user.username).toMatch(testUserAccount.user.username);
	});

	it('should test loginUser() - unsuccessful login with error message', () => {
		const testError: string = 'test error';
		let testUserAccount: Account = new Account();
		testUserAccount.user = new User();
		spyOn<any>(component['userService'], 'loginUser').and.returnValue(
			throwError({
				error: {
					error: testError
				}
			})
		);
		spyOn<any>(component['userService'], 'setUserDetails');
		spyOn<any>(component['locationService'], 'loadUser');
		spyOn(component, 'trackUserIdleTimout');
		
		component.loginUser();

		expect(component.userLoggedIn).toBe(false);
		expect(component.errorMessage).toMatch(testError);
	});

	it('should test loginUser() - unsuccessful login with default error message', () => {
		const testError: string = "Login failed";
		let testUserAccount: Account = new Account();
		testUserAccount.user = new User();
		spyOn<any>(component['userService'], 'loginUser').and.returnValue(
			throwError({})
		);
		spyOn<any>(component['userService'], 'setUserDetails');
		spyOn<any>(component['locationService'], 'loadUser');
		spyOn(component, 'trackUserIdleTimout');
		
		component.loginUser();

		expect(component.userLoggedIn).toBe(false);
		expect(component.errorMessage).toMatch(testError);
	});

	it('should test requestUser() - username provided', () => {
		let testUserAccount: Account = new Account();
		testUserAccount.user = new User();
		testUserAccount.user.username = 'testuser';
		spyOn<any>(component['userService'], 'getUser').and.returnValue(
			of(testUserAccount)
		);

		component.requestUser();

		expect(component.userLoggedIn).toBe(true);
	});

	it('should test requestUser() - username not provided', () => {
		let testUserAccount: Account = new Account();
		testUserAccount.user = new User();
		spyOn<any>(component['userService'], 'getUser').and.returnValue(
			of(testUserAccount)
		);

		component.requestUser();

		expect(component.userLoggedIn).toBe(false);
	});

	it('should test performLogoutRoutine()', () => {
		const testError = {
			error: 'test error'
		};
		spyOn<any>(component['locationService'], 'clearUserData');
		spyOn<any>(component['userService'], 'logoutUser');
		spyOn<any>(component['locationService'], 'loadUser');
		spyOn(component, 'stopTrackUserIdleTimout');
		spyOn<any>(component['router'], 'navigate');

		component.performLogoutRoutine(testError);

		expect(component.currentUser).toBeFalsy();
		expect(component.username).toMatch('');
		expect(component.password).toMatch('');
	});

	// it('should test userAuthListener() - TODO', () => {
	// 	const testAuthError: AuthError = new AuthError();
	// 	testAuthError.userLoggedIn = false;
	// 	testAuthError.error = 'test error';
	// 	// spyOn(component, 'authSub').andReturn(
	// 	// 	of(testAuthError)
	// 	// );
	// 	spyOn<any>(component['authService'], 'userLoginState')
	// 		.and.returnValue(of(testAuthError));
	// 	spyOn(component, 'performLogoutRoutine');
	// 	component.userAuthListener();
	// 	// TODO: Finish this one
	// });

	it('should test sendResetEmail() - invalid email from authService', () => {
		const testError = "Email is invalid";
		spyOn<any>(component['authService'], 'emailIsValid')
			.and.returnValue(false);

		component.sendResetEmail();

		expect(component.errorMessage).toMatch(testError);
	});

	it('should test sendResetEmail() - invalid email with error message from backend', () => {
		const resetEmail = 'test@test.test';
		const mockResponse = {'error': 'test error'};
		spyOn<any>(component['authService'], 'emailIsValid')
			.and.returnValue(true);
		spyOn<any>(component['authService'], 'sendResetEmail')
			.and.returnValue(of(mockResponse));

		component.sendResetEmail();

		expect(component.errorMessage).toMatch(mockResponse.error);
	});

	it('should test sendResetEmail() - valid email', () => {
		const resetEmail = 'test@test.test';
		const mockResponse = {'status': 'test status'};
		spyOn<any>(component['authService'], 'emailIsValid')
			.and.returnValue(true);
		spyOn<any>(component['authService'], 'sendResetEmail')
			.and.returnValue(of(mockResponse));

		component.sendResetEmail();

		expect(component.resetMessage).toMatch(mockResponse.status);
	});

	it('should test showResetView() - verify parameters get set', () => {
		const expectedResetForm = true;
		const expectedLoginForm = false;
		const expectedRegisterForm = false;
		const expectedResetMessage = "";
		const expectedAllowReset = true;

		component.showResetView();

		expect(component.resetForm).toBe(expectedResetForm);
		expect(component.loginForm).toBe(expectedLoginForm);
		expect(component.registerForm).toBe(expectedRegisterForm);
		expect(component.resetMessage).toMatch(expectedResetMessage);
		expect(component.allowReset).toBe(expectedAllowReset);
	});

	it('should test trackUserIdleTimout() - TODO', () => {
		// Test counter on DOM.
		// Test user logout when time is up.
	});

});
