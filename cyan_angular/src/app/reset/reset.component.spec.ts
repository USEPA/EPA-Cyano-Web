import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RouterTestingModule } from "@angular/router/testing";
import { HttpClientModule } from '@angular/common/http';

import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { ResetComponent } from './reset.component';

describe('ResetComponent', () => {

  let component: ResetComponent;
  let fixture: ComponentFixture<ResetComponent>;
  let testParams = {
    token: 'test token'
  };
  let routeSpy;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        RouterTestingModule
      ],
      declarations: [ ResetComponent ],
      providers: [
        AuthService,
        LoaderService,
        CyanMap
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResetComponent);
    component = fixture.componentInstance;

    // spyOn<any>(component['activatedRoute'], 'queryParams')
    //   .and.returnValue(of(testParams));
    // spyOn(component.activatedRoute, 'queryParams').and.returnValue(of(testParams))

    fixture.detectChanges();

  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });

  // ngOnInit() {

  //   this.activatedRoute.queryParams.subscribe((params) => {
  //     if (Object.keys(params).length != 1 || params['token'] == undefined) {
  //       // Invalid request if more than one param or if no 'token'
  //       this.authService.logout({'error': "Invalid reset request."});
  //       this.redirectToLogin("Invalid reset request.");
  //       return;
  //     }

  //     if (!this.authService.validateToken(params['token'])) {
  //       // Checks if token is valid
  //       this.authService.logout({'error': "Invalid reset token."});
  //       this.redirectToLogin("Invalid reset token.");
  //       return;
  //     }

  //     this.authService.setSession(params['token']);  // stores valid token in localStorage

  //   });

  // }

});
