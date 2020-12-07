import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from "@angular/router/testing";
import { HttpClientModule } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { MockLocation } from '../../testing/mocks/location';
import { ActivatedRouteStub } from '../../testing/activated-route-stub';
import { Location } from '../models/location';
import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { LatestImageComponent } from './latest-image.component';

describe('LatestImageComponent', () => {

  let component: LatestImageComponent;
  let fixture: ComponentFixture<LatestImageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientModule
      ],
      declarations: [
        LatestImageComponent
      ],
      providers: [
        AuthService,
        LoaderService,
        CyanMap
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LatestImageComponent);
    component = fixture.componentInstance;
    component.location = new MockLocation();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
