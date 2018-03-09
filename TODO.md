# Font
* add other format for font and icomoon

# In elastic model:

* remove keyName in album schema

# Cover:

* Refactor queryFactory -> max album 10 000
* Chunk es search on album

# Config file:

* Check upload var if it use

# Security:

* sanitize meta
* block route for non authenticated user and add config file for that

# Installation process:

* simplify it (script ...)
* add automatic admin user

# Building db, elastic, cover:

* add admin page for that

# Package.json

* add/remove react-notification-system

# DraggableList
* Why is connect to store with null, null ?

# Webpack

* Check why webpack doesn't put all style in modules/core/client/components/style in the css file
  instead it put it in the bundle.js
  
# UX

# Search Bar 
* suggestion pass under album track

## User
* check client route /user/:username what's the diff between my acount
* bug to change user role on admin page

## Albums

* Click On track line must be Pause

