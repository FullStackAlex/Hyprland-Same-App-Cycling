# Hyprland Same App Cycling
A Node.js script to cycle through open instances of the same app that is currently focused, similar to parts of the Gnome App Switcher functionality.

- install node
```bash
sudo pacman -S node # on Arch
sudo apt-get install -y nodejs # on Debian/Ubuntu
```
- download / copy the index.js script
- add two key binds in ~/.config/hypr/hyprland.conf that run the script:
```
binde = SUPER, X, exec, $HOME/.bin/cycle_clients_by_class.js
binde = SUPER SHIFT, X, exec, $HOME/.bin/cycle_clients_by_class.js "prev"
```
- start cycling

## Notes:
- toggles fullscreen off in the workspace of the next client / window if the fullscreen window is not the next window
- tried to implement to turn each next client's / window's fullscreen on, but was quite buggy for some reason (I'm lazy to investigate right now)
- might be buggy in some edge cases didn't test for any situation. For basic usage, though, it works suprisangly flawless. 
