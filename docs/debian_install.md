# Install instruction for Ubuntu/Debian


First you need to clone the projet :

```
cd ~
git clone https://github.com/dimitriaguera/playlist-app.git playlistapp
cd playlistapp
```


## With install script

Now you can chose to run the install script :

```
cd install
chmod u+x installDebian
./installDebian
```

## Manually 

### Update your linux

```
sudo apt update
sudo apt upgrade -y
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

### Installing Node.js (if you don't have)

NB: See https://nodejs.org/en/download/ for more information.

```
curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -
sudo apt install -y nodejs
```

### Installing ﻿Mongodb (if you don't have)

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

### Installing ﻿Java (need for elastic, if you don't have)

NB : openJRE

```
sudo apt install default-jre
```

### Installing Elastic (if you don't have)

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