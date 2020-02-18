import { Component, OnInit } from '@angular/core';
import {LocationService} from "../services/location.service";
import {LocationType} from "../models/location";

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {

  public data_type: LocationType;

  constructor(private locationService: LocationService) { }

  ngOnInit() {
    this.data_type = this.locationService.getDataType();
  }

  dataTypeClick(type: number): void {
    this.data_type = type;
    this.locationService.setDataType(type);
  }

  linksClick(l: any): void {
    let link = "https://www.epa.gov";
    switch(l){
      case "accessibility":
        link = "https://www.epa.gov/accessibility";
        break;
      case "administrator":
        link = "https://www.epa.gov/aboutepa/epas-administrator";
        break;
      case "budget":
        link = "https://www.epa.gov/planandbudget"
        break;
      case "contracting":
        link = "https://www.epa.gov/contracts";
        break;
      case "grants":
        link = "https://www.epa.gov/home/grants-and-other-funding-opportunities";
        break;
      case "snapshot":
        link = "https://19january2017snapshot.epa.gov/";
        break;
      case "nofear":
        link = "https://www.epa.gov/ocr/whistleblower-protections-epa-and-how-they-relate-non-disclosure-agreements-signed-epa-employees";
        break;
      case "privacy":
        link = "https://www.epa.gov/privacy";
        break;
      case "privacynotice":
        link = "https://www.epa.gov/privacy/privacy-and-security-notice";
        break;
      case "data":
        link = "https://www.data.gov";
        break;
      case "inspectorgeneral":
        link = "https://www.epa.gov/office-inspector-general/about-epas-office-inspector-general";
        break;
      case "jobs":
        link = "https://www.epa.gov/careers";
        break;
      case "news":
        link = "https://www.epa.gov/newsroom";
        break;
      case "opengov":
        link = "https://www.epa.gov/open";
        break;
      case "regulations":
        link = "https://www.regulations.gov/";
        break;
      case "subscribe":
        link = "https://www.epa.gov/newsroom/email-subscriptions";
        break;
      case "usagov":
        link = "https://www.usa.gov/";
        break;
      case "whitehouse":
        link = "https://www.whitehouse.gov/";
        break;
      case "contactus":
        link = "https://www.epa.gov/home/forms/contact-epa";
        break;
      case "hotlines":
        link = "https://www.epa.gov/home/epa-hotlines";
        break;
      case "foia":
        link = "https://www.epa.gov/foia";
        break;
      case "faq":
        link = "https://www.epa.gov/home/frequent-questions-specific-epa-programstopics";
        break;
      case "facebook":
        link = "https://www.facebook.com/EPA";
        break;
      case "twitter":
        link = "https://twitter.com/epa";
        break;
      case "youtube":
        link = "https://www.youtube.com/user/USEPAgov";
        break;
      case "flickr":
        link = "https://www.flickr.com/photos/usepagov";
        break;
      case "instagram":
        link = "https://www.instagram.com/epagov";
        break;
      default:
        break;
    }
    window.open(link, "_blank");
  }

}
