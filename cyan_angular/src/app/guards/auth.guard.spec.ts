import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuModule } from '@angular/material/menu';

import { AuthService } from '../services/auth.service';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {

  let service: AuthGuard;
  let authServiceSpy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ AuthGuard ]
    })
    .compileComponents();
  });

  it('should create', () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'logout']);
    service = new AuthGuard(authServiceSpy);
    expect(service).toBeTruthy();
  });

  it('should test canActivate() - not authenticated', () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'logout'])
    service = new AuthGuard(authServiceSpy);

    service.canActivate();

    expect(service).toBeTruthy();
  });

  it('should test canActivate() - authenticated', () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', {
      'isAuthenticated': true,
      'logout': null
    });
    service = new AuthGuard(authServiceSpy);

    service.canActivate();

    expect(service).toBeTruthy();
  });

});
