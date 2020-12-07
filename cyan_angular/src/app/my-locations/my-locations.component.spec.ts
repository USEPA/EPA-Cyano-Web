import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from "@angular/router/testing";
import { HttpClientModule } from '@angular/common/http';

import { MockLocation } from '../../testing/mocks/location';
import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { MyLocationsComponent } from './my-locations.component';

describe('MyLocationsComponent', () => {

  let component: MyLocationsComponent;
  let fixture: ComponentFixture<MyLocationsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientModule
      ],
      declarations: [ MyLocationsComponent ],
      providers: [
        AuthService,
        LoaderService,
        CyanMap
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyLocationsComponent);
    component = fixture.componentInstance;
    component.locations = [new MockLocation()];
    component.sorted_locations = [new MockLocation()];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
