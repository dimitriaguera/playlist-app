# Make a systemD service for linux

This permit to start the playlistApp app with the computer

```
./install
```

You can start/stop/restart playlistApp with :

```
sudo systemctl status playlistapp
sudo systemctl start playlistapp
sudo systemctl stop playlistapp
sudo systemctl restart playlistapp
```

Check journal

```
journalctl -f
sudo systemctl status playlistapp
```
