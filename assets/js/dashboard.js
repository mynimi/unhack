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
    let others = document.querySelector('.sidenav span.active')
    let el = e.target
    others.classList.remove("active")
    el.classList.add("active")
    exports.open()
})

module.exports.open = function openDashboard(){
    fs.readFile(functions.htmlPath('dashboard'), (err, data) => {
        pageContent.innerHTML = data
        document.querySelector('.project-name').innerHTML = store.get('projectName')
        if(err) {
            console.log(err)
        }
    })
}
