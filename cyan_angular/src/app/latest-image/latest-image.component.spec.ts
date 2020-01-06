import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LatestImageComponent } from './latest-image.component';

describe('LatestImageComponent', () => {
  let component: LatestImageComponent;
  let fixture: ComponentFixture<LatestImageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LatestImageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LatestImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
