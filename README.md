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
