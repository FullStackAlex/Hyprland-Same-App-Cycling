#!/bin/node
const { exec } = require('child_process');

// hyprctl used multiple times, so it's better to wrap it in a DRY function
const getHyprCtlJSON = (command) => {
    return new Promise((resolve, reject) => {
        exec(`hyprctl -j ${command}`, (err, stdout, stderr) => {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.parse(stdout));
            }
        });
    });
};


// get all instances of the currently focused application
const getSameClassClients = (clients, activeWindow) => {
    return clients.filter((client) => {
        return client.class === activeWindow.class;
    });
};

//put all clients of the same class as the active one into a map that is grouped by their workspace they are in,
// so that there are no back and forth jumps between workspaces,but a continuous cycle in a circle
const getClientsByWorkspace = (sameClassClients) => {
    return sameClassClients.reduce((acc, client) => {
        if (!acc[client.workspace.id]) {
            acc[client.workspace.id] = [];
        }
        acc[client.workspace.id].push(client.address);
        return acc;
    }, {});
};

//concat the arrays into one array, sorted by workspace id
const getSameClassClientsSorted = (clientsByWorkspace) => {
    const workspaceIds = Object.keys(clientsByWorkspace).sort();

    return workspaceIds.reduce((acc, id) => {
        return acc.concat(clientsByWorkspace[id]);
    }, []);
};

// get the address of the client next in the cycle
const getNextClient = (clients, activeWindow, direction) => {
    const sameClassClients = getSameClassClients(clients, activeWindow);
    const clientsByWorkspace = getClientsByWorkspace(sameClassClients);
    const sameClassClientsSorted = getSameClassClientsSorted(clientsByWorkspace);
    const currentClientIndex = sameClassClientsSorted.findIndex((address) => {
        return address === activeWindow.address;
    });
    const nextClientIndex = (currentClientIndex + direction + sameClassClientsSorted.length) % sameClassClientsSorted.length;
    const nextAddress = sameClassClientsSorted[nextClientIndex];
    return clients.find((client) => {
        return client.address === nextAddress;
    });
};

// get all clients in the same workspace as the next client
const sameWorkspaceClients = (clients, nextClient)=>{
    return clients.filter((client) => {
        return client.workspace.id === nextClient.workspace.id;
    });
}


// if there is a fullscreen client in the same workspace as the next client, toggle fullscreen off
const toggleWrongFullscreenClient = (clients, nextClient) => {
    const wrongFullscreenClient = sameWorkspaceClients(clients,nextClient).find((client) => {
        return client.fullscreen && client.address !== nextClient.address;
    });
    if (wrongFullscreenClient) {
        exec(`hyprctl dispatch focuswindow address:${wrongFullscreenClient.address}`);
        exec(`hyprctl dispatch fullscreen false`);
    }
};

const toggleFullscreen = () => {
    exec(`hyprctl dispatch fullscreen true`);
}

const focusNextClient = (nextClient) => {
     exec(`hyprctl dispatch focuswindow address:${nextClient.address}`);
};

const toggleSpecialWorkspace = (activeWindow, nextClient) => {
    if (activeWindow.workspace.id === -99 && nextClient.workspace.id !== -99) {
        // not working, even though it actually should according to hyprctl man page and hyprland dispatch wiki ...
        //exec(`hyprctl dispatch togglespecialworkspace`)
        //theoretical workaround: execute a key press (SUPER + C)instead - not working neither ....
        //exec(`wtype -M "win" -k "c"`);
    }
};

// check if the first argument is "prev" (= cycling backwards) and set direction accordingly, if "avoidingspecial is given as third argument, jump by 2 instead of 1
const getDirection = () => {
    if (process.argv[3] === "avoidingspecial") {
        if (process.argv[2] === 'prev') {
            return -2;
        } else {
            return 2;
        }
    } else {
        if (process.argv[2] === 'prev') {
            return -1;
        } else {
            return 1;
        }
    }
}

const checkSpecialWorkspace = (direction, nextClient, clients, activeWindow) => {
    let newDirection = direction;
    if (nextClient.workspace.id === -99) {
        // get the sign of the direction
        let sign = direction / Math.abs(direction);
        // jump by 2 instead of 1
        newDirection =  (Math.abs(direction) + 2) * sign;
    }
    nextClient = getNextClient(clients, activeWindow, newDirection);
    if(nextClient.workspace.id === -99) {
        checkSpecialWorkspace(newDirection, nextClient);
    }else{
        return  nextClient;
    }
}

// wait for both promises to resolve and then execute the rest of the script
(async () => {
    const [clients, activeWindow] = await Promise.all([
        getHyprCtlJSON('clients'),
        getHyprCtlJSON('activewindow'),
    ]);

    let direction = getDirection();
    let nextClient = getNextClient(clients, activeWindow, direction);
    nextClient = checkSpecialWorkspace(direction, nextClient, clients, activeWindow);
    toggleWrongFullscreenClient(clients, nextClient);
    focusNextClient(nextClient);
    //super buggy:
    //toggleFullscreen();


    //if active window is fullscreen toggle next client fullscreen too
    //

    // if the active window is in the special workspace, toggle the special workspace off after moving to the next client, not working though ...
    // toggleSpecialWorkspace(activeWindow, nextClient);
})();
