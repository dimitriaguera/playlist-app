#!/usr/bin/env bash

######################## HELPERS

## Get path of this file
path_of_this_file=`dirname "$0"`
path_of_this_file=`( cd "${path_of_this_file}" && pwd )`

# colorize and formatting command line
green='\x1B[0;32m'
cyan='\x1B[1;36m'
blue='\x1B[0;34m'
grey='\x1B[1;30m'
red='\x1B[0;31m'
bold='\033[1m'
normal='\033[0m'

function say_blue {
  echo -e "${blue}${bold}$1${normal}"
}

function say_red {
  echo -e "${red}${bold}$1${normal}"
}

function say_green {
  echo -e "${green}${bold}$1${normal}"
}

function say_grey {
  echo -e "${green}$1${normal}"
}

## Ask Something With Choice
function ask_choice () {
#XXX: FANCIER select ALTERNATIVE
## $1     : MESSAGE
## $2     : DEFAULT (AS INDEX IN $choices) IF USER PROVIDES AN EMPTY ANSWER
## $3-n   : CHOICES (WITH UNIQUE LEADING CHARACTER, E.G: "yes" "no" "abort")
## returns: 0, AND SETS $BOTASK_ANSWER TO THE ANSWER'S INDEX WITHIN $choices

  ## EASE OUR DEVS' LIFE
  [[ $2 =~ ^-?[0-9]+$ ]] || fatal_prog_error "'$2' IS NOT AN INTEGER";

  local msg="$1" def_choice=$2; shift 2
  local choices=($@)
  local prompt="$BP"
  BOTASK_ANSWER="$def_choice"             #XXX: ACCESS TO USER'S CHOICE
  for c in "$@"; do
    if [[ "$c" == "${choices[$def_choice]}" ]]; then
      prompt="$prompt${LARG}[${c:0:1}]${c:1}${NORM} "
    else
      prompt="$prompt[${c:0:1}]${c:1} "
    fi
  done

  while true; do
    echo -ne "$BP$B_AWAKE "
    say_green "$msg"
    echo " "
    echo -ne "$prompt> "
    read ans
    for (( i=0; i<=${#choices[@]}-1; i++ )); do
      test -z $ans && return 0            #TDL: PRESSING SPACE (RETURN OK)
      c=${choices[$i]}
      if [[ "$ans" == ${c:0:1} ]]; then
        echo
        BOTASK_ANSWER=$i && return 0      #XXX: set -e SO RETURN 0
      fi
    done
    echo -e "\r$BP$B_EMBRS"               ## USER MISTYPED: EMBARRASSMENT
  done
}

path_of_this_file=`dirname "$0"`
path_of_this_file=`( cd "${path_of_this_file}" && pwd )`
install_path=''
function install_path_fct () {
  cd $path_of_this_file/../
  install_path=`pwd`
  cd $path_of_this_file
}
install_path_fct
######################## END HELPERS


####### System

sudo apt update

say_blue "I updating the package lists"
ask_choice "Do I need to update the system ? " 0 no yes
if [[ $BOTASK_ANSWER == 1 ]]; then
  sudo apt upgrade -y
fi

ask_choice "Do I need to update system distribution ? " 0 no yes
if [[ $BOTASK_ANSWER == 1 ]]; then
  sudo apt dist-upgrade
fi

ask_choice "Do I need to update raspberry firmware ? " 0 no yes
if [[ $BOTASK_ANSWER == 1 ]]; then
  sudo rpi-update
fi


ask_choice "Do I need to install build-essential and cmake ? " 0 no yes
if [[ $BOTASK_ANSWER == 1 ]]; then
  sudo apt install -y build-essential
  sudo apt install cmake
fi


####### Node
ask_choice "Do I need to install nodejs ? " 0 no yes
if [[ $BOTASK_ANSWER == 1 ]]; then
  curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash
  command -v nvm
  source ~/.bashrc
  nvm install --lts
fi


####### MongoDB
ask_choice "Do I need to install MongoDb ? " 0 no yes
if [[ $BOTASK_ANSWER == 1 ]]; then
  sudo apt install mongodb
  sudo systemctl enable mongodb
fi


####### Java
ask_choice "Do I need to install Java ? " 0 no yes
if [[ $BOTASK_ANSWER == 1 ]]; then
  sudo apt install default-jre
fi


####### Elastic
ask_choice "Do I need to install Elastic ? " 0 no yes
if [[ $BOTASK_ANSWER == 1 ]]; then
  wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
  sudo apt install apt-transport-https
  echo "deb https://artifacts.elastic.co/packages/6.x/apt stable main" | sudo tee -a /etc/apt/sources.list.d/elastic-6.x.list
  sudo apt update && sudo apt install elasticsearch
  sudo systemctl enable elasticsearch
fi


####### PlaylistApp

say_blue "I am going to install playlistApp"
cd ${install_path}
say_blue "Install path is : ${install_path}"

## Npm install
ask_choice "Do I need to run npm install ? " 0 no yes
if [[ $BOTASK_ANSWER == 1 ]]; then
  npm install
  npm install # two times
fi

## Config of PlaylistApp
say_blue "I am going to config PlayListApp"
say_green "Where is your music (default : ~/music ) ? "
read music_path
if [ -z "$music_path" ]; then
    music_path="~/music"
fi
cp config/conf/config.private.example.js config/conf/config.private.js
sed -i '' 's|./data/music|'"${music_path}"'|' config/conf/config.private.js
cp config/conf/config.public.example.js config/conf/config.public.js

## Build production dist
ask_choice "Do I need to build prod distribution ? " 0 no yes
if [[ $BOTASK_ANSWER == 1 ]]; then
  npm run build-prod
fi

## Make systemD script
say_blue "Make a systemD script"

say_grey "Link to /usr/local/bin"
sudo ln -sf ${path_of_this_file}/playlistapp.init /usr/local/bin/playlistapp.init

say_grey "Make script executable"
sudo chmod u+x /usr/local/bin/playlistapp.init

say_grey "Copy to /etc/systemd/system/playlistapp.service"
sudo cp -rf ${path_of_this_file}/playlistapp.service /etc/systemd/system/playlistapp.service

say_grey "Enable service"
sudo systemctl enable playlistapp

say_grey "Start service"
sudo systemctl start playlistapp


say_red "Normally now you can go to localhost:8080 to see the app"

say_blue "See Playlist log : sudo systemctl status playlistapp"
say_blue "You can change port, music path, mongo acces in : ${path_of_this_file}/conf/config.private.js"