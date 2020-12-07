import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { CyanMap } from '../utils/cyan-map';
import { DialogComponent } from '../shared/dialog/dialog.component';
import { CoordinatesComponent } from './coordinates.component';

describe('CoordinatesComponent', () => {
  let component: CoordinatesComponent;
  let fixture: ComponentFixture<CoordinatesComponent>;

  const mockDialogComponent = {

  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        MatDialogModule
      ],
      declarations: [ CoordinatesComponent ],
      providers: [
        AuthService,
        LoaderService,
        CyanMap,
        {
          provide: DialogComponent,
          useValue: mockDialogComponent
        }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CoordinatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
