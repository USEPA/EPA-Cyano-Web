import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { MatMenuModule } from '@angular/material/menu';

import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { BottomMenuComponent } from './bottom-menu.component';

describe('BottomMenuComponent', () => {
  
  let component: BottomMenuComponent;
  let element: HTMLElement;
  let fixture: ComponentFixture<BottomMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientModule,
        MatMenuModule
      ],
      declarations: [ BottomMenuComponent ],
      providers: [
        AuthService,
        LoaderService,
        CyanMap
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {

    fixture = TestBed.createComponent(BottomMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should test dataTypeClick() - type is set', () => {
    const testType: number = 1;
    spyOn<any>(component['locationService'], 'setDataType');

    component.dataTypeClick(testType);

    expect(component.data_type).toEqual(testType);
  });

});
