#!/usr/bin/env bash

# colorize and formatting command line
# You need iTerm and activate 256 color mode in order to work : http://kevin.colyar.net/wp-content/uploads/2011/01/Preferences.jpg
green='\x1B[0;32m'
cyan='\x1B[1;36m'
blue='\x1B[0;34m'
grey='\x1B[1;30m'
red='\x1B[0;31m'
bold='\033[1m'
normal='\033[0m'

# Jump a line
function line () {
  echo " "
}

# Say something
function botg () {
  echo -e "${green}${1}${normal}"
}

# check if provided folder name already exists
# no => create it
function chkdir () {
  if [ ! -d "${1}" ]
  then
    botg "Creation du répertoire ${1}"
    mkdir $1
  fi
}

# Get the dirname for the file
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

botg $DIR

cd $DIR

chkdir log
chkdir db

#Lunch MongoDB daemon

# Log in log File ce qui est pas bien pour le raspberry
#mongod --dbpath db --logpath log/mongod.log &
#mongod --dbpath db < /dev/null &>/dev/null &
botg "Starting Mongod"
screen -d -m -S mongod mongod --dbpath db

# Start Elastic
botg "Starting Elastic"
screen -d -m -S elastic marcW/elasticsearch-6.0.0/bin/./elasticsearch

# Start server
botg "Starting Server"
#npm run start
#screen -d -m -S npm run start
screen -d -m -S playlist bash -c 'NODE_ENV=production node server'

