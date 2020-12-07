import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from "@angular/router/testing";
import { MatDialogModule } from '@angular/material/dialog';

import { MockLocation } from '../../testing/mocks/location';
import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { LocationCompareComponent } from './location-compare.component';

describe('LocationCompareComponent', () => {

  let component: LocationCompareComponent;
  let fixture: ComponentFixture<LocationCompareComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        RouterTestingModule,
        MatDialogModule
      ],
      declarations: [ LocationCompareComponent ],
      providers: [
        AuthService,
        LoaderService,
        CyanMap
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LocationCompareComponent);
    component = fixture.componentInstance;
    component.selected_locations = [new MockLocation()];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
