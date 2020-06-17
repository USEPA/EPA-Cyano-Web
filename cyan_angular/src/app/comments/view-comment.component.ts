import { Component, OnInit, Inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { MatIconModule } from '@angular/material/icon';

import { DownloaderService } from '../services/downloader.service';
import { AuthService } from '../services/auth.service';

import { Comment, CommentBody, Reply } from '../models/comment';



@Component({
  selector: 'view-comment',
  templateUrl: 'view-comment.html',
  styleUrls: ['./comments.component.css']
})
export class ViewComment implements OnInit {
	/*
	Dialog for viewing a user comment.
	*/

	comment: Comment;
  commentBody: CommentBody;
	imageSources: string[] = [];
	body: string = ""; // reply content
  errorMessage: string = "";

	constructor(
		private datePipe: DatePipe,
    public dialogRef: MatDialogRef<ViewComment>,
    private downloader: DownloaderService,
  	private authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
    this.comment = this.data.comment;
    this.commentBody = this.data.comment.body;
  }

  private createReply(): Reply {
  	let newReply = new Reply();
  	newReply.comment_id = this.comment.id;
  	newReply.comment_user = this.comment.username;
  	newReply.date = this.datePipe.transform(new Date(), 'yyyy-MM-dd hh:mm:ss');
  	newReply.body = this.body;  // reply content
  	return newReply;
  }

  exit(): void {
    this.dialogRef.close();
  }

  addReplyToComment() {
  	/*
  	Adds reply to a user comment.
  	*/
  	if (!this.authService.checkUserAuthentication()) {
      this.exit();
      return;
    }

    // TODO: More validity checking for user replies???

    if (this.body.length < 1) {
      this.errorMessage = "Enter a reply before submitting.";
      return;
    }

  	let reply = this.createReply();
  	this.downloader.addReplyToComment(reply).subscribe(response => {
  		reply.username = response['username'];  // gets username from response, which is from token 
  		this.comment.replies.push(reply);  // adds reply to frontend after api response
      this.body = "";  // clears reply textarea
  	});
  }

}