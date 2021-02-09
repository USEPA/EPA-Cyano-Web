import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { MatMenuModule } from '@angular/material/menu';

import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let setTitleSpy;
  let userServiceSpy;
  let locationServiceSpy;
  const testNotifications = {};


  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        RouterTestingModule,
        MatMenuModule
      ],
      declarations: [ HeaderComponent ],
      providers: [
        AuthService,
        LoaderService,
        CyanMap
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {

    HeaderComponent.prototype.ngOnInit = () => {};  // skips ngOnInit
    HeaderComponent.prototype.ngOnDestroy = () => {};  // skips ngOnInit
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    userServiceSpy = spyOn<any>(component['userService'], 'allNotifications$')
      .and.returnValue(of(null));
    locationServiceSpy = spyOn<any>(component['locationService'], 'compare$')
      .and.returnValue(of(null));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should test setTitle()', () => {
    component.setTitle();

    expect(component.title).toMatch('Cyanobacteria Assessment Network');
  });

  it('should test displayLogout()', () => {
    spyOn(component, 'setTitle');
    let routerSpy = spyOn<any>(component['router'], 'navigate');

    component.displayLogout();

    expect(routerSpy).toHaveBeenCalledWith(['/account', {loggingOut: true}]);
  });

});
