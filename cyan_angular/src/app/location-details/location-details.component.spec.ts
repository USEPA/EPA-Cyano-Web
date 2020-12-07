import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from "@angular/router/testing";
import { HttpClientModule } from '@angular/common/http';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet'; 

import { MockLocation } from '../../testing/mocks/location';
import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { LocationDetailsComponent } from './location-details.component';

describe('LocationDetailsComponent', () => {

  let component: LocationDetailsComponent;
  let fixture: ComponentFixture<LocationDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientModule,
        MatBottomSheetModule
      ],
      declarations: [ LocationDetailsComponent ],
      providers: [
        AuthService,
        LoaderService,
        CyanMap
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LocationDetailsComponent);
    component = fixture.componentInstance;
    component.current_location = new MockLocation();
    component.locations = [new MockLocation()];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
