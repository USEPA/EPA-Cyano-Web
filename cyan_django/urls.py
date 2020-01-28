from datetime import datetime
from django.conf.urls import url
from django.urls import path, re_path
from django.contrib.staticfiles.views import serve
# import django.contrib.auth.views
from .views import cyan_access_view


urlpatterns = [
	# # Endpoints for Cyan Web App (regex used to serve up Angular 7 static files)
	# re_path(r'^webapp/([A-Za-z]*)$', web_app.landing),
	# re_path(r'^webapp/(?P<path>.*)$', serve),
	# re_path(r'^webapp/assets/(?P<path>.*)$', serve),
	# re_path(r'^webapp/leaflet/(?P<path>.*)$', serve),
	# Endpoints for Cyan Web App (regex used to serve up Angular 7 static files)
	re_path(r'^([A-Za-z]*)$', cyan_access_view),
	re_path(r'^(?P<path>.*)$', serve),
	re_path(r'^assets/(?P<path>.*)$', serve),
	re_path(r'^leaflet/(?P<path>.*)$', serve),
]