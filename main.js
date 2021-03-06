// Modules to control application life and create native browser window
const {
    app,
    BrowserWindow,
    ipcMain,
    dialog,
    Menu,
    shell
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
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })

    mainWindow.on('close', function(event){
        if (store.has('currentPageEditPath') || store.has('currentPostEditPath')) {
            event.preventDefault()
            dialog.showMessageBox({
                type: 'warning',
                title: 'Unsaved Changes',
                message: "You are still editing Content. Please either save or cancel your changes in Posts/Pages."
            })
        }
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)


app.on('before-quit', function(event){
    if (store.has('currentPageEditPath') || store.has('currentPostEditPath')) {
        event.preventDefault()
        dialog.showMessageBox({
            type: 'warning',
            title: 'Unsaved Changes',
            message: "You are still editing Content. Either Save or Cancel your changes before moving on."
        })
    }
})

// Quit when all windows are closed.
app.on('window-all-closed', function (event) {
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

                                // console.log(configPath)

                                if (fs.existsSync(configPath)) {
                                    store.set('currentProjectPath', files)

                                    store.set('configFilePath', configPath)
                                    
                                    const config = fs.readFileSync(configPath)
                                    const c = JSON.parse(config)

                                    store.set('projectName', c.name)
                                    // console.log(c.name)
                                    // console.log('new project path is ' + store.get('currentProjectPath'))

                                    mainWindow.setTitle(`unHack | ${store.get('projectName')} ${store.get('currentProjectPath') ? store.get('currentProjectPath') : ''}`)
                                    mainWindow.reload();
                                    mainWindow.webContents.send('project-opened')

                                } else {
                                    dialog.showErrorBox('Not an Unhack Project', 'The Directory you selected does not seem to be an Unhack Project.')
                                }
                                // console.log(files)
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
                },
                {
                    label: 'Open current Project in Explorer/Finder',
                    click(){
                        shell.openExternal(store.get('currentProjectPath').toString())
                    }
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
                { label: 'Upload Site',
                    click: function(){
                        mainWindow.webContents.send('open-upload')
                    }
                 },
                {
                    label: 'Preview Site',
                    enabled: 'false'
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                { label: 'Toggle Between Dark & Light Mode',
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
                { label: 'Documentation',
                  click(){
                      shell.openExternal('https://unhacked.halfapx.com/docs/')
                  }
                },
                {
                    label: 'About',
                    enabled: 'false'
                },
                { type: 'separator' },
                { label: 'unHack Website',
                enabled: 'false'
                },
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
                        dialog.showMessageBox({
                            type: 'info',
                            title: 'Settings Cleared',
                            message: 'All User Settings have been reset to Default'
                        })
                        mainWindow.reload()
                    }
                },
                {
                    label: `Turn Advanced View ${store.get('advancedView') ? 'Off' : 'On'}`,
                    enabled: 'false',
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

    // console.log('current Path' + store.get('currentProjectPath'));

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
        mainWindow.reload();
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

    ipcMain.on('show-error-message', function (event, errorTitle, msg) {
        dialog.showErrorBox(errorTitle, msg)
    })

    ipcMain.on('show-message-box', function(event, msgType, msgTitle, msg){
        dialog.showMessageBox({
            type: msgType,
            title: msgTitle,
            message: msg
        })
    })
    ipcMain.on('open-link', function(event, urlToOpen){
        shell.openExternal(urlToOpen)
    })
    ipcMain.on('ready-to-start', function(event){
        mainWindow.webContents.send('show-open-and-create')
    })
    ipcMain.on('do-reload', function(event){
        mainWindow.reload();
    })
});