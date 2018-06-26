const fs = require('fs')
const path = require('path')
const shell = require('shelljs')
const child_process = require('child_process')
const prefs = require('./prefs')
let store = prefs.store

const {
    ipcRenderer,
    remote
} = require('electron');

const pageContent = document.querySelector('.container')
const popupContent = document.querySelector('.popup .content-loader')
const functions = require("./functions.js")

// const jekyllFiles = functions.getPathsInDir(store.get('currentProjectPath').toString())

// console.log(jekyllFiles);

