import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { AuthService } from '../services/auth.service';


@Component({
  selector: 'app-batch',
  templateUrl: './batch.component.html',
  styleUrls: ['./batch.component.css']
})
export class BatchComponent {
  /*
  Dialog for viewing a user image.
  */

  hasFile: boolean = false;
  uploadedFile: File;
  acceptedType: string = "csv";

  constructor(
    public dialogRef: MatDialogRef<BatchComponent>,
    private authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

  exit(): void {
    this.dialogRef.close();
  }

  uploadFile(event): void {

    this.uploadedFile = event.target.files[0];
    let fileExtension = this.uploadedFile.name.split(".").splice(-1)[0];

    if (fileExtension != this.acceptedType) {
      // TODO: Display error to user.
      console.log("File is not of type CSV.");
      return;
    }

    let reader = new FileReader();
    reader.onload = (e) => {
      let fileContent = reader.result;
      console.log("FileReader onload called.");
      console.log(e);
      console.log(reader.result);
    }
    reader.readAsText(this.uploadedFile);
  }

}
