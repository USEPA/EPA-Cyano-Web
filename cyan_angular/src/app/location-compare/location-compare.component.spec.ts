import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationCompareComponent } from './location-compare.component';

describe('LocationCompareComponent', () => {
  let component: LocationCompareComponent;
  let fixture: ComponentFixture<LocationCompareComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LocationCompareComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LocationCompareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
