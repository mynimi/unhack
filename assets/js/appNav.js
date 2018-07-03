const fs = require('fs');
const prefs = require('./prefs')
const {
    ipcRenderer,
    remote
} = require('electron');

let store = prefs.store

const pageContent = document.querySelector('.container')

const functions = require("./functions.js");
const sideNavigation = document.querySelector('.sidenav .navigation')

ipcRenderer.on('project-opened', function () {
    document.querySelector('body').classList.add('has-sidenav')
    document.querySelector('.sidenav').classList.remove('hidden')
})

if (!store.get('currentProjectPath')) {
    document.querySelector('body').classList.remove('has-sidenav')
    document.querySelector('.sidenav').classList.add('hidden')
} else{
    document.querySelector('body').classList.add('has-sidenav')
    document.querySelector('.sidenav').classList.remove('hidden')
}

sideNavigation.addEventListener('click', function(e){
    let others = document.querySelector('.sidenav span.active')
    let el = e.target 
    let htmlFile = el.dataset.htmlfile
    if(htmlFile != ""){
        if (others)
            others.classList.remove("active")
        let contentPath = functions.htmlPath(htmlFile)
        fs.readFile(contentPath, (err, data) => {
            pageContent.innerHTML = data
            el.classList.add("active")
        })
    }
})