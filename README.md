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

For all plateform you need :

Node.js : https://nodejs.org/en/download/
MongoDB : https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/
Java (needs by ElasticSearch) Open JRE / Oracle JRE : http://www.oracle.com/technetwork/java/javase/downloads/index.html
ElasticSearch : https://www.elastic.co/downloads/elasticsearch
CMAKE : https://cmake.org/download/

For installing all this prerequisite and more see next section installing.

### Installing

For Ubuntu/Debian see : [Installing on Debian/Ubuntu](docs/debian_install.md)
For Raspbian on Raspberry see : [Installing on Debian/Ubuntu](docs/rasp_install.md)

## Default Conf

Default admin user :

* id : admin
* password : Adminpwd1@

Please change this.

## Developers section

See [Developers](docs/dev.md)

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


