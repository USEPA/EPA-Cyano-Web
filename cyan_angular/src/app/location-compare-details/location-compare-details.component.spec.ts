import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationCompareDetailsComponent } from './location-compare-details.component';

describe('LocationCompareDetailsComponent', () => {
  let component: LocationCompareDetailsComponent;
  let fixture: ComponentFixture<LocationCompareDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LocationCompareDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LocationCompareDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
