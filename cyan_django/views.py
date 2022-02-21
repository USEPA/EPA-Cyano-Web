from django.template.loader import render_to_string
from django.http import HttpResponse
from django.shortcuts import redirect
import importlib
import os



def cyan_access_view(request, exception=None):
	"""
	Access epa-cyano-web Angular application.
	"""
	html = render_to_string("EPA-Cyano-Web/index.html")  # loads from templates_qed
	response = HttpResponse()
	response.write(html)
	return response


def redirect_view(request, exception=None):
	return redirect('/cyanweb')