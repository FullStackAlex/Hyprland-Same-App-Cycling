#!/bin/node
import {exec} from "child_process";


function getArg(name) {

    const args = process.argv.slice(2);

    let fullscreen = false;
    let direction = 'forward';

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const nextArg = args[i + 1];

        if (arg === '--fullscreen' && ['borderless', 'bordered'].includes(nextArg)) {
            fullscreen = nextArg;
            i++; // skip next argument
        } else if (arg === '--direction' && ['forward', 'back'].includes(nextArg)) {
            direction = nextArg;
            i++; // skip next argument
        }
    }

    direction = direction === 'forward' ? 1 : -1;

    switch (name) {
        case 'fullscreen':
            return fullscreen;
        case 'direction':
            return direction;
        default:
            return undefined;
    }
}



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
    
    let clientsByWorkspace =  sameClassClients.reduce((acc, client) => {
        if (!acc[client.workspace.id]) {
            acc[client.workspace.id] = [];
        }
        //remove clients in the special workspace from the cycle, as it's currently not possible to toggle the special workspace off (using hyprctl) when moving on to a client outside the special workspace
        if(client.workspace.id !== -99) {
            acc[client.workspace.id].push(client.address);
        }

        return acc;
    }, {});
    //sort the clients within each workspace by the ascending client address id, so that the order of the clients in the cycle is the same on each iteration
    // otherwise the order changes on each movement like this:
    // on one client it's { '3': [ '0x4ec230e0', '0x4ec172a0' ], '4': [ '0x4d6686c0' ] }
    // but on the other it's { '3': [ '0x4ec172a0', '0x4ec230e0' ], '4': [ '0x4d6686c0' ] }
    // so that it cycle only between the two clients in workspace 3 and never moves on to the client in workspace 4
    clientsByWorkspace = Object.values(clientsByWorkspace).map((clients) => {
        return clients.sort((a, b) => {
            return a - b;
        });
    } );

    return clientsByWorkspace;
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
        exec(`hyprctl dispatch fullscreen`);
    }
};

const toggleFullscreen = (fullscreenMode) => {
    if(fullscreenMode === 'borderless'){
        exec(`hyprctl dispatch fullscreen 0`);
    } else if(fullscreenMode === 'bordered'){
        exec(`hyprctl dispatch fullscreen 1`);
    }
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


// wait for both promises to resolve and then execute the rest of the script
(async () => {

    const [clients, activeWindow] = await Promise.all([
        getHyprCtlJSON('clients'),
        getHyprCtlJSON('activewindow'),
    ]);

    let direction = getArg('direction');

    let nextClient = getNextClient(clients, activeWindow, direction);
    if(nextClient.address !== activeWindow.address) {
        toggleWrongFullscreenClient(clients, nextClient);
        focusNextClient(nextClient);

        //if active window is fullscreen toggle next client fullscreen too
        const fullscreen = getArg('fullscreen');
        if(!nextClient.fullscreen && fullscreen){
            toggleFullscreen(fullscreen);
        }
    }
    // if the active window is in the special workspace and the next client is not, toggle the special workspace off, not working though ...
    // toggleSpecialWorkspace(activeWindow, nextClient);
})();
