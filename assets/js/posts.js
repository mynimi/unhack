const fs = require('fs')
const path = require('path')
const shell = require('shelljs')
const child_process = require('child_process')
const prefs = require('./prefs')
const functions = require("./functions.js")

let store = prefs.store

const {
    ipcRenderer,
    remote
} = require('electron');

let pageContent = document.querySelector('.container')

document.querySelector('.nav-posts').addEventListener('click', function (e) {
    generatePostsList()
})

function generatePostsList(){
    const postsPath = path.join(store.get('currentProjectPath'), '_posts')
    const postPathList = functions.getPathsInDir(postsPath.toString())

    let output = `<div class="cardholder"><div class="card"><div class="card-content">`    
    output += postsPathList
    output += `</div></div></div>`
    pageContent.innerHTML = output
    // functions.inputStyle()

console.log(jekyllFiles);

}
