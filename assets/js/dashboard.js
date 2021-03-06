const fs = require('fs')
const prefs = require('./prefs')
let store = prefs.store

const {
    ipcRenderer,
    remote
} = require('electron');

const pageContent = document.querySelector('.container')

const functions = require("./functions.js")

document.querySelector('.nav-dashboard').addEventListener('click', function (e) {
    exports.open()
})

module.exports.open = function openDashboard(){
    let others = document.querySelector('.sidenav span.active')
    others.classList.remove("active")
    document.querySelector('.nav-dashboard').classList.add("active")
    fs.readFile(functions.htmlPath('dashboard'), (err, data) => {
        pageContent.innerHTML = data
        document.querySelector('.project-name').innerHTML = store.get('projectName')
        if(err) {
            console.log(err)
        }
    })
}
