import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LinksLeftComponent } from './links-left.component';

describe('LinksLeftComponent', () => {
  let component: LinksLeftComponent;
  let fixture: ComponentFixture<LinksLeftComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LinksLeftComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LinksLeftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
