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

  it('should test clearFile() - uploader element cleared', () => {

  });

  it('should test stopJobPolling()', () => {

  });

  it('should test pollJobStatus()', () => {

  });

  it('should test validateUploadedFile()', () => {

  });

  it('should test validateFileContent()', () => {

  });

  it('should test cleanString()', () => {

  });

  it('should test createBatchLocations()', () => {

  });

  it('should test clearInputFields()', () => {

  });

  it('should test uploadFile()', () => {

  });

  it('should test tabChange()', () => {

  });

  it('should test createTable()', () => {

  });

  it('should test sortTable()', () => {

  });

  it('should test cancelJob()', () => {

  });

  it('should test makeCancelJobRequest()', () => {

  });

  it('should test makeJobStartRequest()', () => {

  });

  it('should test displayMessageDialog()', () => {

  });

  it('should test convertJobsDatetimesToLocal()', () => {

  });

  it('should test convertDatetime()', () => {

  });

  it('should test updateTableJob()', () => {

  });

});
