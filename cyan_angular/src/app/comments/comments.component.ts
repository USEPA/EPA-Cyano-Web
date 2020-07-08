import { Component, OnInit, Inject, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { AddComment } from './add-comment.component';
import { ViewComment } from './view-comment.component';

import { DownloaderService } from '../services/downloader.service';
import { AuthService } from '../services/auth.service';
import { LoaderService } from '../services/loader.service';

import { Comment, Reply } from '../models/comment';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.css']
})
export class CommentsComponent implements OnInit {

	comments: Comment[] = [];

  downloaderSub: Subscription;

  constructor(
  	private downloader: DownloaderService,
  	private authService: AuthService,
  	private dialog: MatDialog,
    private addComment: AddComment,
    private loaderService: LoaderService
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
      c.comment_text = comment.comment_text;
      c.comment_images = comment.comment_images;
  		c.replies = comment.replies || [];  // NOTE: Defaulting to blank array
  		commentObjects.push(c);
  	});
  	return commentObjects;
  }

  getComments() {
  	/*
  	Gets all users' comments.
  	*/
    if (this.downloaderSub) {
      this.downloaderSub.unsubscribe();
    }
    this.loaderService.show();
    this.downloaderSub = this.downloader.getAllComments().subscribe((comments: Comment[]) => {
      this.comments = this.createComments(comments);
      this.loaderService.hide();
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
      data: {
        comments: this.comments
      }
    });
  }

}




