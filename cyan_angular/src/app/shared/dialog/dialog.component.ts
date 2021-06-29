import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from "@angular/material/dialog";



@Component({
  selector: 'app-dialog',
  template: `
  <div class="center-wrapper">
  <button style="float:right;font-size:x-large;" mat-button (click)="exit(false);">X</button>
  <br><br>
  <h6 class="center-item">{{dialogMessage}}</h6>
  <br><br>
  <button class="center-item" mat-raised-button color="primary" (click)="exit(true);">OK</button>
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
    @Inject(MAT_DIALOG_DATA) public data: any,
    public messageDialog: MatDialog
  ) { }

  ngOnInit() {
    this.dialogMessage = this.data.dialogMessage;
  }

  exit(response: boolean): void {
    this.dialogRef.close(response);
  }

  displayMessageDialog(message: string): void {
    /*
    Displays dialog messages to user.
    */
    this.messageDialog.open(DialogComponent, {
      data: {
        dialogMessage: message
      }
    });
  }

  handleError(errorMessage: string): void {
    /*
    Display error message and throws exception, which
    halts the execution of following statements.
    */
    this.displayMessageDialog(errorMessage);
    throw errorMessage;
  }

}