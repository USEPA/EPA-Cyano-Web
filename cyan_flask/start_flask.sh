#!/bin/bash

rm -rf /src/collected_static/pram_qaqc_reports 
cp -r /src/pram_flask/pram_qaqc_reports /src/collected_static
exec uwsgi --ini /etc/uwsgi/uwsgi.ini