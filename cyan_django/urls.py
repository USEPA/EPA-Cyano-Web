from datetime import datetime
from django.conf.urls import url
from django.urls import path, re_path
from django.contrib.staticfiles.views import serve
# import django.contrib.auth.views
from .views import cyan_access_view, redirect_view


urlpatterns = [
	
	# Endpoints for Cyan Web App
	path('', cyan_access_view),
	re_path(r'^.*/$', redirect_view)

]