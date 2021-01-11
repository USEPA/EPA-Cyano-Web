#!/bin/sh

# Changes directory to python app:
cd /cyan_flask

# Removes any requirements.new file that may exist:
rm requirements.new

# Tries to upgrade pip:
python -m pip install --upgrade pip

# Gets packages without version numbers:
packages=$(cat requirements.txt | sed 's/==.*//g');

# Installs latest versions of packages:
echo $packages | xargs pip install --upgrade;

# Creates temp reqs file from updated reqs:
echo $(pip freeze) | tr " " "\n" > requirements.freeze

# Creates new req file with updated verions:
for p in $(echo $packages); do grep -i -m 1 $p requirements.freeze >> requirements.new; done

# Removes temp req file:
rm requirements.freeze

# Moves new req file to shared volume:
mv requirements.new /docker/flask/requirements.new


# Updates only packages listed in requirements.txt
# freeze=$(pip freeze);
# for p in $(echo $packages); do echo $freeze | grep -E "^${p}==" >> requirements.new; done
