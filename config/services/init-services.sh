#!/bin/sh

systemctl daemon-reload

# Enables services:
systemctl enable start-app.service

# Starts services:
systemctl start start-app.service