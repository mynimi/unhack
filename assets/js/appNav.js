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

if (store.has('currentProjectPath')) {
    console.log('we have a path')
    if (fs.existsSync(store.get('currentProjectPath').toString())) {
        console.log('path still exists.')
        sidebarDisplay('show')
    } else {
        console.log('path no longer exists, so we start over.')
        sidebarDisplay('hide')
    }
} else {
    sidebarDisplay('hide')
}

function sidebarDisplay(what){
    if(what == 'hide'){
        document.querySelector('body').classList.remove('has-sidenav')
        document.querySelector('.sidenav').classList.add('hidden')
    }
    if(what == 'show'){
        document.querySelector('body').classList.add('has-sidenav')
        document.querySelector('.sidenav').classList.remove('hidden')
    }
}