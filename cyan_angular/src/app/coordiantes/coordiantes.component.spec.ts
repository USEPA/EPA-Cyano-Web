import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoordiantesComponent } from './coordiantes.component';

describe('CoordiantesComponent', () => {
  let component: CoordiantesComponent;
  let fixture: ComponentFixture<CoordiantesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CoordiantesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CoordiantesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
