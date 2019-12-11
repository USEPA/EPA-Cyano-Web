import { Component, OnInit, NgModule } from '@angular/core';
import { LocationService } from '../services/location.service';
import { UserService } from '../services/user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  title = "Cyanobacteria Assessment Network";
  titleAbr = "CyAN";

  new_notifications = [];
  notificationSubscription: Subscription;

  constructor(
    private userService: UserService
  ) { }

  ngOnInit() {
   //  let self = this;
  	// setTimeout(function() {
   //    self.userService.getAllNotifications();
   //  }, 100);

  	// Does this subscrition make sense?
    this.notificationSubscription = this.userService.allNotifications$.subscribe(
      	notifications => {
        	console.log("Received notifications update in header component.");	
        	this.new_notifications = notifications;
     	}
     );

    // this.notificationService.getAllNotifications().subscribe(
    // 	notifications => {
	   //      console.log("Notifications: ");
	   //      console.log(notifications);
    // 	}
    // );
  }

  ngOnDestroy() {
    this.notificationSubscription.unsubscribe();
  }


}
