# CyAN Angular 7 Web Application

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/81dad835e0754bd69618ef879129c035)](https://app.codacy.com/app/dbsmith88/cyan-web-app?utm_source=github.com&utm_medium=referral&utm_content=dbsmith88/cyan-web-app&utm_campaign=Badge_Grade_Dashboard)

### Description
The Cyanobacteria Assessment Network (CyAN) Web Application is a web browser adaption of the Android CyAN app. The CyAN web app was built using [Angular 7](https://angular.io/) and a collection of open source packages: [ngx-leaflet](https://www.npmjs.com/package/@asymmetrik/ngx-leaflet?activeTab=dependencies) which is an Angular wrapper for [Leaflet](https://leafletjs.com/), [ng5-slider](https://www.npmjs.com/package/ng5-slider), and [ng2-charts](https://www.npmjs.com/package/ng2-charts). These packages were selected for their compatibility with the project and being stable/active.

The CyAN web app was developed as a standalone Angular app, but intended for integration into the [QED](https://github.com/quanted/qed) stack, specifically into the qed_django container. User registration/login and location addition/deletion/editing are all handled by Django using sqlite3. The django REST API endpoints are all located in the [qed/cyan_app](https://github.com/quanted/cyan_app) repo.

### Development
[Angular Official Documentation](https://angular.io/guide/quickstart)
#### Prerequisites
   - [Node.js](https://nodejs.org/en/)
   - Angular CLI: install with the following command in the terminal
```sh
$ npm install -g @angular/cli
```
#### Angular Project Setup
Clone CyAN project from github
```sh
$ git clone https://github.com/dbsmith88/cyan-web-app.git
```
Install required node modules
```sh
$ cd cyan-web-app
$ npm install
```
Serving up project with development server, from root directory of the project
```sh
$ ng serve --open
```
The web app will now be running in your browser. While running the development server, saving updates to the component and service files will trigger an automatic recompile and reload in the browser.

The commented out line below in 'src/app/downloader.service.ts' must be switched for local development.
```javascript
66  // private baseServerUrl: string = "http://127.0.0.1:8000/cyan/app/api/";      // TESTING URL
67  private baseServerUrl: string = "/cyan/app/api/";                           // Production URL
```

The web app will attempt to send requests to a locally deployed django server on port 8000 for database calls. The qed repo will need to be running, with cyan_app updated to latest on dev branch and containing the sqlite3 database file for the cyan app.

### Deployment
#### Angular Build
Build Angular app for production deploy
```sh
ng build
```
By default, the build command will compile all the project code into static files located 'dist/PROJECT'. The angular.json file, in the root of the project, contains the compile and build configuration settings, including the output directory of the build and directories for the static files. If the angular project was a submodule in a corresponding django repo, these output directories could be set to the django static directory.

The following provides one method for Angular integration into Django, that has only been tested with Angular 7 and Django 2. The Angular project is assumed to be completely separated from the Django project.
#### Static Files
The compiled output from the Angular dist directory will need to be copied into the existing Django static directory, or a new static directory will need to be specified. In the django settings.py file, add a variable containing the path to where the static directory was copied to and add that to the STATICFILES_DIR collection. Even though the Angular static directory is already located inside the existing static directory, we have to add the directory to allow django to serve up the files shown further down.
```python
CYAN_ANGULAR_APP_DIR = "static_qed/cyan/webapp"

STATICFILES_DIRS = (
    os.path.join(PROJECT_ROOT, 'static_qed'),
    os.path.join(PROJECT_ROOT, CYAN_ANGULAR_APP_DIR)
)
```
#### Template Files
In the static Angular files will be an index.html, this file contains the imports and structure for your Angular web app. Though it is located in the static files, to make the urls more understandable and allow for rendering, like a typical template, we will copy the index.html and move it into an appropriate directory in 'templates_qed'. Again, this step is not entirely necessary but does provide some potential benefits. The index.html file should not change unless under most circumstances. I have updated the paths for static files that are requested in the index file for this reason.
#### Django App
##### urls
To be able to use the static files and allow for Angular's routing, the following urls are required in the cyan_app/urls.py
```python
7   from django.urls import path, re_path
8   from django.contrib.staticfiles.views import serve

73  re_path(r'^webapp/([A-Za-z]*)$', web_app.landing),
74  re_path(r'^webapp/(?P<path>.*)$', serve),
75  re_path(r'^webapp/assets/(?P<path>.*)$', serve),
76  re_path(r'^webapp/leaflet/(?P<path>.*)$', serve),
```
Breakdown:
   - Line 7, re_path allows the use of regular expressions with Django 2.0+. 
   - Line 8, allows use to direct Django to serve static files when the Angular app makes calls for static files using the paths set in the Angular project. This process is why it was necessary to add the previously mentioned lines to settings.py .
   - Line 73, directs to the main Angular app. The regex will prevent 404 errors if a user attempts to navigate to the app from a valid route inside the Angular app. Example:  cyan/webapp/ will bring up cyan/webapp/account/ for login, but if you reload the page you will get a 404 error without the regex in this line.
   - Line 74-76, are used by the Angular app for static files, indicated by the '.' in the regex. The imported 'serve' function is utilized here.
 ##### web_app
The template file for the web app is rendered and provided as a HttpResponse, as any typical Django template file would be. The potential benefits for using a template index.html instead of one from the static directory could be realized here. If we wished to include a csrf token, or some other token for security reason, we would be able to set that will a simple change to the template and the render() argument. It would also be possible to add whatever background additions to the application we desired through Django without having to make changes to the Angular project requiring a rebuild.

#### Docker
Currently in development.

The only additional requirement for running the application in Docker, is to place the sqlite3 database into a volume and correctly point to the volume from cyan_app.
