#!/bin/sh

# Save original package.json before major update:
cp package.json package.json.orig.major

# Updates package.json to latest versions (including major):
npx ncu -u --packageFile /app/package.json

# Installs packages using updated package.json:
npm install

#  security audit and possible fixes:
npm audit fix

# Analyzes dependencies:
# npx depcheck

# Performs linting for Angular code:
# npx ng lint

npx ng serve --host 0.0.0.0
