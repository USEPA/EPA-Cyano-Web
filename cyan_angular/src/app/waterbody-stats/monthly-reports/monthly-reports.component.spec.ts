import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthlyReportsComponent } from './monthly-reports.component';

describe('MonthlyReportsComponent', () => {
  let component: MonthlyReportsComponent;
  let fixture: ComponentFixture<MonthlyReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MonthlyReportsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MonthlyReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
