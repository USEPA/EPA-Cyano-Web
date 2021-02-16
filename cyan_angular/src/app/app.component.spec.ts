import { Component } from '@angular/core';
import { TestBed, async, ComponentFixture } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {

  let component: AppComponent;
  // let element: HTMLElement;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        MockLoaderComponent,
        MockHeaderComponent,
        MockAppRoutingModule,
        MockMarkerMapComponent,
        MockBottomMenuComponent,
        MockFooterComponent,
        MockSessionTimeoutComponent
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;  // the component instance
    // element = fixture.nativeElement;  // the html reference
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it(`should have as title 'cyan-web-app'`, () => {
    const title = 'Cyan Web App';
    expect(component.title).toEqual(title);
  });
});

// Mock objects:
@Component({
  selector: 'app-header',
  template: ''
})
class MockHeaderComponent {
}

@Component({
  selector: 'router-outlet',
  template: ''
})
class MockAppRoutingModule {
}

@Component({
  selector: 'app-marker-map',
  template: ''
})
class MockMarkerMapComponent {
}

@Component({
  selector: 'app-bottom-menu',
  template: ''
})
class MockBottomMenuComponent {
}

@Component({
  selector: 'app-footer',
  template: ''
})
class MockFooterComponent {
}

@Component({
  selector: 'app-session-timeout',
  template: ''
})
class MockSessionTimeoutComponent {
}

@Component({
  selector: 'app-loader',
  template: ''
})
class MockLoaderComponent {
}
