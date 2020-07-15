import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";



@Component({
  selector: 'app-dialog',
  template: `
  <br><br>
  <div class="center-wrapper">
  <h6 class="center-item">{{dialogMessage}}</h6>
  <br><br>
  <button class="center-item" mat-raised-button color="primary" (click)="exit();">OK</button>
  </div>
  <br>
  `,
  styleUrls: ['./dialog.component.css']
})
export class DialogComponent {
  /*
  Dialog for viewing a user image.
  */

  dialogMessage: string = "";

  constructor(
    public dialogRef: MatDialogRef<DialogComponent>,
    // private authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
    this.dialogMessage = this.data.dialogMessage;
  }

  exit(): void {
    this.dialogRef.close();
  }

}