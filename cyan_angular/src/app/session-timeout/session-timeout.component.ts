import { Component, OnInit } from '@angular/core';
import { UserIdleService } from 'angular-user-idle';
import {Subscription} from "rxjs";
import {Router} from "@angular/router";
import {UserService} from "../services/user.service";

@Component({
  selector: 'app-session-timeout',
  templateUrl: './session-timeout.component.html',
  styleUrls: ['./session-timeout.component.css']
})
export class SessionTimeoutComponent implements OnInit {

  loginSub: Subscription = null;

  constructor(
    private router: Router,
    private userService: UserService,
    private userIdle: UserIdleService
  ) { }

  ngOnInit() {
  }

  extendSession(): void {
    this.userService.currentAccount.user.sessionCountDown = 0;
    this.userIdle.resetTimer();
  }
}
