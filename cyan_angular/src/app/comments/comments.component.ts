import { Component, OnInit, Inject, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { MatIconModule } from '@angular/material/icon';

import { AddComment } from './add-comment.component';
import { ViewComment } from './view-comment.component';

import { DownloaderService } from '../services/downloader.service';
import { AuthService } from '../services/auth.service';

import { Comment, CommentBody, Reply } from '../models/comment';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.css']
})
export class CommentsComponent implements OnInit {

	comments: Comment[] = [];

  constructor(
  	private downloader: DownloaderService,
  	private authService: AuthService,
  	private dialog: MatDialog,
  	private addCommentDialog: AddComment,
  ) { }

  ngOnInit() {
  	this.getComments();
  }

  private createComments(comments): Comment[] {
  	let commentObjects: Comment[] = [];
  	console.log("comments component createComments() called.");
  	comments.forEach(comment => {
  		let c = new Comment();
  		c.id = comment.id;
  		c.title = comment.title;
  		c.date = comment.date;
  		c.username = comment.username;
  		c.device = comment.device;
  		c.browser = comment.browser;
  		c.body = comment.body;
  		c.replies = comment.replies || [];  // NOTE: Defaulting to blank array
  		commentObjects.push(c);
  	});
  	return commentObjects;
  }

  getComments() {
  	/*
  	Gets all users' comments.
  	*/
  	this.downloader.getAllComments().subscribe(comments => {
  		this.comments = this.createComments(comments);
  	});
  }

  viewComment(comment: Comment) {
  	/*
  	Opens user comment in dialog.
  	*/
  	if (!this.authService.checkUserAuthentication()) { return; }
    const dialogRef = this.dialog.open(ViewComment, {
      width: '50%',
      height: '75%',
      data: {
        comment: comment
      }
    });
  }

  addNewComment() {
  	/*
  	Opens dialog for user to add a comment.
  	*/
  	if (!this.authService.checkUserAuthentication()) { return; }
    const dialogRef = this.dialog.open(AddComment, {
      width: '50%',
      height: '75%',
      data: { }
    });
  }

}




