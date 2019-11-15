# Install instruction for Raspberry on Raspian

- Download Raspbian lite (https://www.raspberrypi.org/downloads/raspbian/)
- Flash it on a sdcard
- Plug it in raspberry and start it
- Login with pi / raspberry (the keyboard is in english)

## Config raspian

```
sudo raspi-config
```

Change **password** (this is realy important),
keyboard layout,
overclock,
gpu memory to 16mb,
active ssh connection,
Expand Filesystem

Save, reboot and connect to raspb with ssh

## Secure the server :

### SSH

```
sudo nano /etc/ssh/sshd_config
```

Change default port,
use Protocol 2,
StrictModes yes
remove root login (PermitRootLogin no),
RSAAuthentication no
UsePAM no
KerberosAuthentication no
GSSAPIAuthentication no
LoginGraceTime 120
MaxAuthTries 3
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
MaxStartups 3

```
sudo systemctl restart ssh
```

Now you have change the port you need to login by ssh to : (change PORT and IPRAPSBERRY)

```
ssh -p PORT pi@IPRASPBERRY
```

#### Make authentication by SSH key :

On your computer :

```
ssh-keygen -t rsa -f ~/.ssh/rasp
ssh-copy-id -p PORT -i ~/.ssh/rasp.pub pi@IPRASPBERRY
ssh-add -K rasp
```

Now try to connect to your raspberry I must don't ask to password.

### Install Fail2ban

```
sudo apt install fail2ban
```

Add config local :

```
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local
```

Change port in [sshd].
Change destemail

```
sudo fail2ban-client reload
sudo fail2ban-client status sshd
```

You can see the new rules with

```
iptables -L
```

## Clone the project :

```
cd ~
git clone https://github.com/dimitriaguera/playlist-app.git playlistapp
cd playlistapp
```

## Install with install script

Now you can chose to run the install script :

```
cd install
chmod u+x installDebian
./installDebian
```

## Install manually

Note Raspberry Pi version 2 or 3 is ARMv7
Note Raspberry Pi version 1 is ﻿ARMv6

To find your cpu version

```
cat /proc/cpuinfo
```

To see note about armhf and armel : https://wiki.debian.org/RaspberryPi

### Update

```
sudo apt update
sudo apt upgrade
sudo apt dist-upgrade

# Update du firmware
rpi-update
```

### Installing build essential (need for some npm module)

```
sudo apt install -y build-essential
```

### Installing cmake

Some node module need cmake

```
sudo apt install cmake
```

### Installing last Node.js (if you don't have)

NB: See https://nodejs.org/dist/ for more information.

Replace the 9.5.0 with the last version ans armv6l to the version of you raspberry.

```
cd ~
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
nvm install --lts
```

### Installing mongodb (if you don't have)

```
sudo apt-get install mongodb
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

To change maximum the max memory allocated for mongo :

```
cp  /etc/mongodb.conf /etc/mongodb.conf.bak
nano /etc/mongodb.conf
```

```
# mongod.conf

# for documentation of all options, see:
#   http://docs.mongodb.org/manual/reference/configuration-options/

# where to write logging data.
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

# Where and how to store data.
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true
#  engine:
#  mmapv1:
  wiredTiger:
    engineConfig:
      configString : cache_size=345M

# how the process runs
#processManagement:
#  fork: true  # fork and run in background
#  pidFilePath: /var/run/mongodb/mongod.pid  # location of pidfile

# network interfaces
net:
  port: 27017
  bindIp: 127.0.0.1  # Enter 0.0.0.0,:: to bind to all IPv4 and IPv6 addresses or, alternatively, use the net.bindIpAll setting.


#security:

#operationProfiling:

#replication:

#sharding:

## Enterprise-Only Options

#auditLog:

#snmp:
```

The important part is

```
  wiredTiger:
    engineConfig:
      configString : cache_size=345M
```

The other way is to start mongo in command line with

```
mongod --dbpath mydbpath --storageEngine wiredTiger --wiredTigerEngineConfigString="cache_size=200M"
```

### Installing Java (need for elastic, if you don't have)

```
sudo apt install -y default-jre
sudo cp -r /usr/lib/jvm/java-8-openjdk-armhf/jre/lib/arm/client /usr/lib/jvm/java-8-openjdk-armhf/jre/lib/arm/server
sudo apt install -y default-jre
```

### Installing Elastic (if you don't have)

```
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
sudo apt install -y apt-transport-https
echo "deb https://artifacts.elastic.co/packages/6.x/apt stable main" | sudo tee -a /etc/apt/sources.list.d/elastic-6.x.list
sudo apt update && sudo apt install -y elasticsearch
sudo systemctl enable elasticsearch
```

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

For raspberry 1 if you have this line comment it :

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

### Installing playlistApp

```
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

When you look at webpack build message if you have

```
ERROR in ./theme/assets/images/default_pl_1.jpg
Module build failed: Error: write EPIPE
    at _errnoException (util.js:992:11)
    at WriteWrap.afterWrite [as oncomplete] (net.js:864:14)
 @ ./node_modules/css-loader??ref--6-1!./node_modules/postcss-loader/lib??ref--6-2!./node_modules/sass-loader/lib/loader.js??ref--6-3!./theme/styles/master.scss 7:77594-77638
 @ ./theme/styles/master.scss
 @ ./modules/core/client/components/App.jsx
 @ ./modules/core/client/components/boot.jsx
 @ ./modules/core/client/index.js
```

or if the app in firefox say :

```
Error: Module build failed: Error: write EPIPE at _errnoException (util.js:992:11) at WriteWrap.afterWrite [as oncomplete] (net.js:864:14)
```

This is apparently an issue with imagemin-mozjpeg. You need to install libpng16-dev

```
sudo apt install libpng16-dev
```

#### Start the app

```
npm run start-prod
```

#### Build the music database

For Mongodb :

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
