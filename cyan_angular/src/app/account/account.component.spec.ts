import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';

import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { AccountComponent } from './account.component';
import { CyanMap } from '../utils/cyan-map';

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

});
