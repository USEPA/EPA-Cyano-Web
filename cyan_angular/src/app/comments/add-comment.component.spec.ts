import { Component } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OverlayModule } from '@angular/cdk/overlay';

import { DownloaderService } from '../services/downloader.service';
import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';
import { AddComment } from './add-comment.component';
import { DialogComponent } from '../shared/dialog/dialog.component';

import { Comment, Reply } from '../models/comment';

describe('AddComment', () => {

  let component: AddComment;
  let fixture: ComponentFixture<AddComment>;

  const mockDialogRef = {
    close: jasmine.createSpy('close')
  };

  const mockDialogComponent = {

  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        HttpClientModule
      ],
      declarations: [
        AddComment
      ],
      providers: [
        {
          provide: MatDialogRef,
          useValue: mockDialogRef
        },
        {
          provide: DialogComponent,
          useValue: mockDialogComponent
        },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {}
        },
        DatePipe,
        AuthService,
        LoaderService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddComment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
