import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MeterComponent } from './meter.component';

describe('MeterComponent', () => {
  let component: MeterComponent;
  let fixture: ComponentFixture<MeterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MeterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MeterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
