import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MyLocationsComponent } from './my-locations.component';

describe('MyLocationsComponent', () => {
  let component: MyLocationsComponent;
  let fixture: ComponentFixture<MyLocationsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MyLocationsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyLocationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
