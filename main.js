// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain, dialog, Menu} = require('electron')
const fs = require('fs');
const path = require('path');

const prefs = require('./assets/js/prefs')
const functions = require("./assets/js/functions.js");

let store = prefs.store

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: store.get('windowBounds.width'),
    height: store.get('windowBounds.height'),
    center: true
  })

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
      label: 'Project',
      submenu: [
        {
          label: 'Open Existing Project',
        },
        {
          label: 'Create New Project',
          click: function(){
            mainWindow.webContents.send('create-project');
          }
        }
      ]
    },
    {
      label: 'demo',
      submenu: [
        {
          label: 'submenu1',
          click: function(){
            console.log('clicked submenu1')
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'submenu2'
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteandmatchstyle' },
        { role: 'delete' },
        { role: 'selectall' },
      ]
    },
    {
      label: 'Help',
    }
  ]
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  console.log('current Path' + store.get('currentProjectPath'));

    mainWindow.on('resize', () => {
      // The event doesn't pass us the window size, so we call the `getBounds` method which returns an object with
      // the height, width, and x and y coordinates.
      let { width, height } = mainWindow.getBounds();
      // Now that we have them, save them using the `set` method.

      store.set('windowBounds.height', height)
      store.set('windowBounds.width', width)
    });


  ipcMain.on('open-directory-dialog', function (event) {
    dialog.showOpenDialog(mainWindow,{
        title: 'Choose Parent Directory of your Project',
        properties: ['openDirectory'],
        buttonLabel: 'Choose'
    }, function (files) {
        if (files) event.sender.send('selectedItem', files)
    })
  })

});
