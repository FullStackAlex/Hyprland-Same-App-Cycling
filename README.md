# Hyprland Same App Cycling
A Node.js helper script for the Hyprland tiling manager which enables cycling through open instances of the same app that is currently focused via a defined key bind, similar to parts of the Gnome App Switcher functionality (Alt+Tab, Super+Tab and Super + <).

- install node
```bash
sudo pacman -S node # on Arch
sudo apt-get install -y nodejs # on Debian/Ubuntu
```
- download / copy the index.mjs script
- check if /bin/node does exist on your machine or make shebang (first line in the index.mjs) point to your existing node binary / executable (check via `$ which node`)
- add two key binds in ~/.config/hypr/hyprland.conf that run the script:
```
binde = SUPER, X, exec, $HOME/.bin/cycle_clients_by_class.mjs
binde = SUPER SHIFT, X, exec, $HOME/.bin/cycle_clients_by_class.mjs --direction back 
binde = SUPER ALT, X, exec, $HOME/.bin/cycle_clients_by_class.mjs --fullscreen bordered
binde = SUPER ALT SHIFT, X, exec, $HOME/.bin/cycle_clients_by_class.mjs --direction back --fullscreen bordered
```
the script accepts two arguments: `--direction` and `--fullscreen`

`--directions` has the options `back` and `forward` (default)

`--fullscreen` has the options `false` (default), `bordered` (equal to `hyprctl dispatch fullscreen 1`) and `borderless` (equal to `hyprctl dispatch fullscreen 0`) 

- start cycling

## Notes:
- by default toggles fullscreen off in the workspace of the next client / window if the fullscreen window is not the next window
- might be buggy in some edge cases didn't test for any situation. For basic usage, though, it works suprisangly flawless. 
