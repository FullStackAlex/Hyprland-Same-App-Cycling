# Hyprland Same App Cycling
Node.js script to cycle through open instances of the same app that is currently focused

- download / copy the script
- add two key binds in ~/.config/hypr/hyprland.conf that run the script:
```
bind = SUPER, X, exec, $HOME/.bin/cycle_clients_by_class.js
bind = SUPER SHIFT, X, exec, $HOME/.bin/cycle_clients_by_class.js "prev"
```

--- 
`hyprctl` features are great. Not sure, though, why this wasn't built natively as a dispatch. How can anyone live without such a cycling... 
