#!/bin/sh

systemctl daemon-reload

# Enables services:
systemctl enable cyano.service

# Starts services:
systemctl start cyano.service