const prefs = require('./prefs')
const {
    ipcRenderer
} = require('electron');

let store = prefs.store

// handles display of sidebar
ipcRenderer.on('project-opened', function () {
    document.querySelector('body').classList.add('has-sidenav')
    document.querySelector('.sidenav').classList.remove('hidden')
    console.log('project was opened')
})

if (!store.has('currentProjectPath')) {
    document.querySelector('body').classList.remove('has-sidenav')
    document.querySelector('.sidenav').classList.add('hidden')
    console.log('there is no project currently open')
} else{
    document.querySelector('body').classList.add('has-sidenav')
    document.querySelector('.sidenav').classList.remove('hidden')
    console.log('there is currently a project open')
}