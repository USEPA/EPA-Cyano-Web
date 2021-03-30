import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { DatePipe } from '@angular/common';

import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { BatchComponent } from './batch.component';

describe('BatchComponent', () => {
  let component: BatchComponent;
  let fixture: ComponentFixture<BatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientModule
      ],
      declarations: [
        BatchComponent
      ],
      providers: [
        AuthService,
        LoaderService,
        DatePipe,
        {
          provide: MatDialogRef,
          useValue: {}
        },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {}
        }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  fit('should test clearFile() - uploader element cleared', () => {

  });

  fit('should test stopJobPolling()', () => {

  });

  fit('should test pollJobStatus()', () => {

  });

  fit('should test validateUploadedFile()', () => {

  });

  fit('should test validateFileContent()', () => {

  });

  fit('should test cleanString()', () => {

  });

  fit('should test createBatchLocations()', () => {

  });

  fit('should test clearInputFields()', () => {

  });

  fit('should test uploadFile()', () => {

  });

  fit('should test tabChange()', () => {

  });

  fit('should test createTable()', () => {

  });

  fit('should test sortTable()', () => {

  });

  fit('should test cancelJob()', () => {

  });

  fit('should test makeCancelJobRequest()', () => {

  });

  fit('should test makeJobStartRequest()', () => {

  });

  fit('should test displayMessageDialog()', () => {

  });

  fit('should test convertJobsDatetimesToLocal()', () => {

  });

  fit('should test convertDatetime()', () => {

  });

  fit('should test updateTableJob()', () => {

  });
  
});
