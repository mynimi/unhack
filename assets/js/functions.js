"use strict"
const fs = require('fs')
const path = require('path')
const prefs = require('./prefs')
let store = prefs.store


// build HTML Path for given file
module.exports.htmlPath = function htmlPath(filename) {
    return path.join(__dirname, '..', 'html', filename+'.html');
}

module.exports.addToConfig = function addToConfig(addConfig){
    const configPath = store.get('configFilePath')
    if (configPath) {
        console.log(configPath)
        fs.readFile(configPath.toString(), (err, data) => {
            if (err) throw err
            let oldConfig = JSON.parse(data)
            let newConfig = { ...oldConfig, ...addConfig}
            console.log(oldConfig)
            console.log(addConfig)
            console.log(newConfig)

            fs.writeFile(configPath.toString(), JSON.stringify(newConfig, null, 2), (err) => {
                if (err) throw err
            })
        })
    } else {
        console.log('no config File Path')
    }
}

// open Popup function
module.exports.openPopup = function openPopup() {
    const body = document.querySelector('body')
    body.classList.add('popup-open')
    let behindPopup = document.createElement("div")
    behindPopup.id = 'behind-popup'
    body.appendChild(behindPopup)
    let popup = document.querySelector('.popup')
    popup.style.display = 'block'
}

module.exports.closePopup = function closePopup() {
    const popup = document.querySelector('.popup');
    const body = document.querySelector('body');
    const backdrop = document.querySelector('#behind-popup');
    popup.style.display = 'none'
    body.classList.remove('popup-open')
    backdrop.remove()
}

// List all Files in Given Directory
module.exports.getPathsInDir = function getPathsInDir(dir, filelist = []) {
    fs.readdirSync(dir).forEach(file => {
        const dirFile = path.join(dir, file);
        try {
            filelist = getPathsInDir(dirFile, filelist);
        } catch (err) {
            if (err.code === 'ENOTDIR' || err.code === 'EBUSY') filelist = [...filelist, dirFile];
            else throw err;
        }
    });
    return filelist;
}

// Styling Input functionality, has to be exported due to being reloaded on dynamically created elements
module.exports.inputStyle = function inputStyle(){
    let inputs = document.querySelectorAll('.wrap input, .wrap textarea')

    inputs.forEach(function (elem, index) {
        styleInput(elem, 'initial')
        elem.addEventListener('focus', function () {
            styleInput(this, 'focus')
            console.log('focus')
        })
        elem.addEventListener('blur', function () {
            styleInput(this, 'blur')
            console.log('blur')
        })
    });
}

function styleInput(e, a) {
    let elName = e.name
    let elLabel = document.querySelector(`label[for="${elName}"]`)
    if (a == 'initial' || 'blur') {
        if (e.placeholder || e.value || e.type == 'date' || e.classList.contains('file')) {
            elLabel.classList.add('up')
        } else {
            elLabel.classList.remove('up')
        }
    }
    if (a == 'focus') {
        elLabel.classList.add('up')
        e.parentNode.classList.add('focus')
    }
    if (a == 'blur') {
        e.parentNode.classList.remove('focus')
    }
}