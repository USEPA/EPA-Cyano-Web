import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from "@angular/router/testing";
import { HttpClientModule } from '@angular/common/http';

import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { SessionTimeoutComponent } from './session-timeout.component';

describe('SessionTimeoutComponent', () => {

  let component: SessionTimeoutComponent;
  let fixture: ComponentFixture<SessionTimeoutComponent>;

  let mockUserService = {
    currentAccount: {
      user: {
        sessionCountDown: 10
      }
    }
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientModule
      ],
      declarations: [ SessionTimeoutComponent ],
      providers: [
        AuthService,
        LoaderService,
        CyanMap,
        {
          providers: UserService,
          useValue: mockUserService
        }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    SessionTimeoutComponent.prototype.ngOnInit = () => {};  // skips ngOnInit
    fixture = TestBed.createComponent(SessionTimeoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should test extendSession()', () => {
    let userSpy = spyOn<any>(component['userIdle'], 'resetTimer');

    component.extendSession();

    expect(userSpy).toHaveBeenCalled();
  });

});
