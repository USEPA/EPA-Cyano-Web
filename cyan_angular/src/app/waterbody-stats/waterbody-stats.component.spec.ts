import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaterbodyStatsComponent } from './waterbody-stats.component';

describe('WaterbodyStatsComponent', () => {
  let component: WaterbodyStatsComponent;
  let fixture: ComponentFixture<WaterbodyStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WaterbodyStatsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WaterbodyStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
