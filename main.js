// Modules to control application life and create native browser window
const {
    app,
    BrowserWindow,
    ipcMain,
    dialog,
    Menu
} = require('electron')
const fs = require('fs');
const path = require('path');

const prefs = require('./assets/js/prefs')
const functions = require("./assets/js/functions.js");

let store = prefs.store


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: store.get('windowBounds.width'),
        height: store.get('windowBounds.height'),
        center: true
    })

    if (store.get('windowMaximized')) {
        mainWindow.maximize()
    }

    mainWindow.setTitle(`unHack | ${store.get('projectName')} ${store.get('currentProjectPath') ? store.get('currentProjectPath') : ''}`);

    // and load the index.html of the app.
    mainWindow.loadFile('index.html')

    // Open the DevTools.
    mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)


// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
app.on('ready', () => {
    const template = [
        {
            label: 'File',
            submenu: [{
                    label: 'Open Existing Project',
                    click(){
                        dialog.showOpenDialog(mainWindow, {
                            title: 'Open unhack Project',
                            properties: ['openDirectory'],
                            buttonLabel: 'Open'
                        }, function (files) {
                            if (files) {
                                const configPath = path.join(files.toString(), 'unhack.json');

                                console.log(configPath)

                                if (fs.existsSync(configPath)) {
                                    store.set('currentProjectPath', files)

                                    store.set('configFilePath', configPath)
                                    
                                    const config = fs.readFileSync(configPath)
                                    const c = JSON.parse(config)

                                    store.set('projectName', c.name)
                                    console.log(c.name)
                                    console.log('new project path is ' + store.get('currentProjectPath'))

                                    mainWindow.setTitle(`unHack | ${store.get('projectName')} ${store.get('currentProjectPath') ? store.get('currentProjectPath') : ''}`)

                                    mainWindow.webContents.send('project-opened')

                                } else {
                                    dialog.showErrorBox('Not an Unhack Project', 'The Directory you selected does not seem to be an Unhack Project.')
                                }
                                console.log(files)
                            } 
                        })
                    }, 
                    accelerator: 'CmdOrCtrl+O'
                },
                {
                    label: 'Create New Project',
                    click: function () {
                        mainWindow.webContents.send('create-project');
                    },
                    accelerator: 'CmdOrCtrl+N'
                }
            ]
        },
        {
            label: 'Actions',
            submenu: [
                {
                    label: 'Edit Publication Settings',
                    click: function () {
                        mainWindow.webContents.send('open-publication-settings');
                    }
                },
                { label: 'Upload Site' },
                { label: 'Preview Site' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { label: 'Toggle Dark Mode',
                    click: function(){
                        mainWindow.webContents.send('toggle-dark-mode')
                    }
                },
                { type: 'separator' },
                { role: 'resetzoom' }, 
                { role: 'zoomin' }, 
                { role: 'zoomout' }, 
                { type: 'separator' }, 
                { role: 'togglefullscreen' }
            ]
        },
        {
            role: 'Help',
            submenu: [
                { label: 'Documentation' },
                { label: 'About' },
                { type: 'separator' },
                { label: 'unHack Website'},
            ]
        },
        {
            label: 'Dev',
            submenu: [
                {
                    label: 'Reset App',
                    click(){
                        // Clear All Setings
                        store.clear()
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'Settings Cleared',
                            message: 'All User Settings have been reset to Default'
                        })
                    }
                },
                {
                    label: `Turn Advanced View ${store.get('advancedView') ? 'Off' : 'On'}`,
                    type: 'checkbox',
                    click(){
                        if(store.get('advancedView')){
                            store.set('advancedView', false)
                        } else{
                            store.set('advancedView', true)
                        }
                        const menu = Menu.buildFromTemplate(template)
                        Menu.setApplicationMenu(menu)
                    }
                },
                { role: 'toggledevtools' },
            ]
        }
    ]
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)

    console.log('current Path' + store.get('currentProjectPath'));

    mainWindow.on('resize', () => {
        // The event doesn't pass us the window size, so we call the `getBounds` method which returns an object with
        // the height, width, and x and y coordinates.
        let {
            width,
            height
        } = mainWindow.getBounds();
        // Now that we have them, save them using the `set` method.

        store.set('windowBounds.height', height)
        store.set('windowBounds.width', width)
    });

    mainWindow.on('maximize', () => {
        store.set('windowMaximized', true);
    })
    
    mainWindow.on('unmaximize', () => {
        store.set('windowMaximized', false);
    })


    ipcMain.on('create-new-done', function(events){
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Project Opened',
            message: 'Your Project has been opened'
        })
        mainWindow.setTitle(`unHack | ${store.get('projectName')} ${store.get('currentProjectPath') ? store.get('currentProjectPath') : ''}`)

        
    })
    ipcMain.on('open-directory-dialog', function (event) {
        dialog.showOpenDialog(mainWindow, {
            title: 'Choose Parent Directory of your Project',
            properties: ['openDirectory'],
            buttonLabel: 'Choose'
        }, function (files) {
            if (files) event.sender.send('selectedItem', files)
        })
    })

});