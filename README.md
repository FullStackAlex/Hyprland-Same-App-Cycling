# Hyprland Same App Cycling
A Node.js helper script for the Hyprland tiling manager which enables cycling through open instances of the same app that is currently focused via a defined key bind, similar to parts of the Gnome App Switcher functionality (Alt+Tab, Super+Tab and Super + <).

- install node
```bash
sudo pacman -S node # on Arch
sudo apt-get install -y nodejs # on Debian/Ubuntu
```
- download / copy the index.js script
- check if /bin/node does exist on your machine or make shebang (first line in the index.js) point to your existing node binary / executable (check via `$ which node`)
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
