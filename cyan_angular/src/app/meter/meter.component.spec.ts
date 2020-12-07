import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from "@angular/router/testing";

import { MockLocation } from '../../testing/mocks/location';
import { LocationService } from '../services/location.service';
import { ConfigService } from '../services/config.service';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { MeterComponent } from './meter.component';

describe('MeterComponent', () => {

  let component: MeterComponent;
  let fixture: ComponentFixture<MeterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        RouterTestingModule
      ],
      declarations: [ MeterComponent ],
      providers: [
        AuthService,
        LoaderService,
        CyanMap
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MeterComponent);
    component = fixture.componentInstance;
    component.location = new MockLocation();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
