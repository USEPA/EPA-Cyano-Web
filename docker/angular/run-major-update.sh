#!/bin/sh

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

npm run build:${env:-standalone}

cp package.json /docker/angular/package.json.major
