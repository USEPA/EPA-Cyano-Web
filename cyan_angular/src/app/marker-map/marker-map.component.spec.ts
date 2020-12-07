import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from "@angular/router/testing";
import { of, Observable } from 'rxjs';

import { MockLocation } from '../../testing/mocks/location';
import { LocationService } from '../services/location.service';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { MarkerMapComponent } from './marker-map.component';

describe('MarkerMapComponent', () => {

  let component: MarkerMapComponent;
  let fixture: ComponentFixture<MarkerMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        RouterTestingModule
      ],
      declarations: [ MarkerMapComponent ],
      providers: [
        AuthService,
        LoaderService,
        CyanMap,
        {
          provide: UserService,
          useClass: MockUserService
        },
        {
          provide: LocationService,
          useClass: MockLocationService
        }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MarkerMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});

class MockUserService {
  getUserName(): string {
    return "testUser";
  }
}

class MockLocationService {
  loadUser(): void {

  }
  getLocations(): Observable<MockLocation[]> {
    return of([new MockLocation]);
  }
}