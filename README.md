# PlaylistApp

This application allowing you to manage, playing your music from anywhere.

This app work fine on Raspberry 1 B+. With some special config for ElasticSearch and MongoDB. See it in the Raspberry section.

## Getting Started

These instructions will get you a copy of the project up and running.

### Prerequisites

You need to install Node, npm, MongoDB, ElasticSearch, java, cmake

Some node module need [node-gyp](https://github.com/nodejs/node-gyp)

On mac you need :
* python (already installed on Mac OS X)
* Xcode
* You also need to install the Command Line Tools via Xcode. You can find this under the menu Xcode -> Preferences -> Downloads
  This step will install gcc and the related toolchain containing make
  
On Unix you need :
* python
* make (I think already install with build-essential)
* A proper C/C++ compiler toolchain, like GCC (I think already install with build-essential)

On Window :
* Install all the required tools and configurations using Microsoft's windows-build-tools using 
 npm install --global --production windows-build-tools` from an elevated PowerShell or CMD.exe (run as Administrator).

#### Installing prerequisite software for Window

Node.js : https://nodejs.org/en/download/
MongoDB : https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/
Java (needs by ElasticSearch) Oracle JDK : http://www.oracle.com/technetwork/java/javase/downloads/index.html
ElasticSearch : https://www.elastic.co/downloads/elasticsearch
CMAKE : https://cmake.org/download/

#### Installing prerequisite software for Linux (Debian or Ubuntu)

##### Update your linux

```
sudo apt update
sudo apt upgrade -y
```

##### Installing build essential (need for some npm module)

```
sudo apt install -y build-essential
```

##### Installing Node.js (if you don't have)

NB: See https://nodejs.org/en/download/ for more information.

```
curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -
sudo apt install -y nodejs
```

##### Installing ﻿Mongodb (if you don't have)

NB: See https://docs.mongodb.com/manual/installation/ for more information.

At the writing time of this readme, Mongodb Package for Debian 9 "Stretch" is not available form the MongoDB own repository.
Instead we use the Debian repository.

```
sudo apt install mongodb
```

Once MongoDB is installed, you will need to start and stop MongoDB, verifying that it functions correctly:
```
sudo systemctl start mongodb
sudo systemctl status mongodb
sudo systemctl stop mongodb
```

To configure mongodb to start automatically when the system boots up, run the following commands:
```
sudo systemctl daemon-reload
sudo systemctl enable mongodb
```

##### Installing ﻿Java (need for elastic, if you don't have)

NB : 
* Elasticsearch recommend to use the Oracle JDK at least 1.8.
* By default Debian install OpenJDK 8. We used to install openJRE and we don't have problem.

```
sudo apt install default-jre
```

##### Installing Elastic (if you don't have)

NB : See https://www.elastic.co/downloads/elasticsearch for more information.

```
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
sudo apt install apt-transport-https
echo "deb https://artifacts.elastic.co/packages/6.x/apt stable main" | sudo tee -a /etc/apt/sources.list.d/elastic-6.x.list
sudo apt-get update && sudo apt-get install elasticsearch
```

To configure Elasticsearch to start automatically when the system boots up, run the following commands:

```
sudo systemctl daemon-reload
sudo systemctl start elasticsearch
sudo systemctl status elasticsearch
sudo systemctl enable elasticsearch
```

##### Installing cmake

Some node module need cmake

```
sudo apt install cmake
```


#### Raspberry (Raspian) without desktop

Note Raspberry Pi version 2 or 3 is ARMv7
Note Raspberry Pi version 1 is ﻿ARMv6

To find your cpu version
```
cat /proc/cpuinfo
```

To see note about armhf and armel : https://wiki.debian.org/RaspberryPi

##### In /boot/config.txt

```
gpu_mem=16
```


##### Update

```
sudo apt update
sudo apt upgrade
sudo apt dist-upgrade

# Update du frimware
rpi-update
```

##### Installing build essential (need for some npm module)

```
sudo apt install -y build-essential
```

##### Installing last Node.js (if you don't have)

NB: See ﻿https://nodejs.org/dist/ for more information.

Replace the 9.5.0 with the last version ans armv6l to the version of you raspberry.

```
cd ~
wget https://nodejs.org/dist/v9.5.0/node-v9.5.0-linux-armv6l.tar.gz
tar -xzf node-v9.5.0-linux-armv6l.tar.gz
node-v9.5.0-linux-armv6l/bin/node -v

cd node-v9.5.0-linux-armv6l/
sudo cp -R * /usr/local/

export PATH=$PATH:/usr/local/bin
node -v
npm -v
```

##### Installing mongodb (if you don't have)

```
sudo apt-get install mongodb-server
```

Once MongoDB is installed, you will need to start and stop MongoDB, verifying that it functions correctly:
```
sudo systemctl start mongodb
sudo systemctl status mongodb
```


To configure mongodb to start automatically when the system boots up, run the following commands:
```
sudo systemctl daemon-reload
sudo systemctl enable mongodb
```

##### Installing ﻿Java (need for elastic, if you don't have)

```
sudo apt-get install oracle-java8-jdk
```

##### Installing Elastic (if you don't have)

```
wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-6.2.2.deb
wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-6.2.2.deb.sha512
shasum -a 512 -c elasticsearch-6.2.2.deb.sha512 
sudo dpkg -i elasticsearch-6.2.2.deb
```

Make some change in the config file :

```
sudo -s
nano /etc/elasticsearch/jvm.options
```

For raspberry 1  if you habve this line comment it :
```
# force the server VM
# -server 
```

And for all raspberry allow less memory
```
# Xms represents the initial size of total heap space
# Xmx represents the maximum size of total heap space

-Xms128m
-Xmx128m
```

After the edition of the file 
```
exit # to quit root
```

Try if elastic start :
```
sudo systemctl daemon-reload
sudo systemctl start elasticsearch.service
sudo systemctl status elasticsearch.service
```

Start elastic with the system :
```
sudo systemctl enable elasticsearch.service
```

If you want to change the port edit the http.port in :
```
sudo -s
/etc/elasticsearch/elasticsearch.yml
```

You can test the serveur with :
```
curl -XGET 'localhost:9200/?pretty'
```

##### Installing cmake

Some node module need cmake

```
sudo apt install cmake
```

### Installing ﻿PlaylistApp

#### Cloning and Installing

```
cd ~
git clone https://github.com/dimitriaguera/playlist-app.git
cd playlist-app
npm install
```

If you have some problem make sure you have installed `cmake`.
And try again

```
npm install
```

Some lib are really more performing but need some compilation process that can cause issue on some platform.
There are list in `optionalDependencies` in `package.json`.

To install them :

```
npm install bcrypt sharp taglib2
```  

Bcrypt is really need on Raspberry if logging take long time.

#### Configuration

You need create two config file based on config.private.example.js and config.public.example.js

```
cd config/conf
cp config.private.example.js config.private.js
cp config.public.example.js config.public.js
```

Now check the config.private.js and see comments for changing it.

#### Build the app

Make sure you have installed the devDependencies. If not run 

```
npm install 
```

Then 

```
npm run build-prod
```

After that you must have a `public/dist` directory.


#### Start the app

```
npm run start-prod
```

#### Build the music database

For Mongodb  :

```
curl -X POST http://localhost:8080/api/nodes/build
```

For Elasticsearch :

```
curl -X POST http://localhost:8080/api/elastic/build
```

For finding the album cover :

```
curl -X POST http://localhost:8080/api/files/cover/all
```

#### Trying the app

Now open a browser and go to 

```
npm run start-prod
http://localhost:8080
```

Voilà !


## Developers section


To build the app and watch files :
```
npm run watch
```

To start the server :
```
npm run start
```

To start eslint :
```
npm run lint
```

To fix eslint :
```
npm run lintfix
```


### Add API route

**YOU HAVE TO ADD IT IN THE /config/init-app.js in initRoutes function**

### Add socket route

#### Server side
  
1)  In your working dir make a new dir name sockets. Inside it make a new file
named *.server.sockets.js*. Take exemple from modules/music/server/sockets/music.server.sockets.js


2) Add your route in init-app.js in socketConnect function 

```
module.exports.socketConnect = function(app) {

    const serve = http.createServer(app);
    const io = socketServer(serve);

    require('../modules/users/server/sockets/users.server.sockets')( socketsEvents, io );
    require('../modules/music/server/sockets/music.server.sockets')( socketsEvents, io );
    
    ADD YOU ROUTE HERE
    require('MY_MODULE_PATH')( socketsEvents, io );
    
    return serve;
};
```

3) Now in your model file you can emit the event like this :

```
const socketsEvents = require('../../../../config/sockets/sockets.conf'); 

socketsEvents.emit( 'yourEvent', yourDATA );
```

#### Client side

To receive event take exemple of : modules/music/client/sockets/music.client.sockets.js


## Built With

* Node.js
* React
* Express
* Redux
* MongoDB
* ElasticSearch

## Authors

* **Dimitri Aguera** - *Initial work* - https://github.com/dimitriaguera
* **Marc Foletto** - https://github.com/marc31


