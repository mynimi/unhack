const prefs = require('./prefs')
const {
    ipcRenderer
} = require('electron');

let store = prefs.store

// handles display of sidebar

ipcRenderer.on('project-opened', function () {
    document.querySelector('body').classList.add('has-sidenav')
    document.querySelector('.sidenav').classList.remove('hidden')
})

if (!store.has('currentProjectPath')) {
    document.querySelector('body').classList.remove('has-sidenav')
    document.querySelector('.sidenav').classList.add('hidden')
} else{
    document.querySelector('body').classList.add('has-sidenav')
    document.querySelector('.sidenav').classList.remove('hidden')
}