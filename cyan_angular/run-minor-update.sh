#!/bin/sh

# Save original package.json minor update:
cp package.json package.json.orig.minor

# Updates NPM packages (but not major versions):
npm update

# Installs packages using updated package.json:
npm install

#  security audit and possible fixes:
npm audit fix

# Analyzes dependencies:
# npx depcheck

# Performs linting for Angular code:
# npx ng lint

npx ng serve --host 0.0.0.0
