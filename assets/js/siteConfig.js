const yaml = require('js-yaml')
const fs = require('fs')
const path = require('path')
const prefs = require('./prefs')
const functions = require("./functions.js")
let store = prefs.store

const {
    ipcRenderer,
    remote
} = require('electron');

let pageContent = document.querySelector('.container')

const configPath = store.get('currentProjectPath')

const siteConfigPath = path.join(configPath, '_config.yml')

document.querySelector('.nav-config').addEventListener('click', function(e){
    let others = document.querySelector('.sidenav span.active')
    let el = e.target
    others.classList.remove("active")
    el.classList.add("active")

    generateSiteConfig()
})

pageContent.addEventListener('click', function (e) {
    if (e.target && e.target.id == 'saveconfig') {
        saveSiteConfig()
    }

    if(e.target && e.target.id == 'edit-site-config'){
        generateSiteConfig()
    }
})

function generateSiteConfig(){
    let doc = {}

    // Get document, or throw exception on error
    try {
        doc = yaml.safeLoad(fs.readFileSync(siteConfigPath, 'utf8'));
        // console.log(doc);
    } catch (e) {
        console.log(e);
    }

    let output = `<div class="middle">` +
        `<h1><span>Site Configuration</span></h1>` +
        `<div class="cardholder">` +
        `<div class="card">` +
        `<div class="card-content siteConfig">`

    for (var key in doc) {
        if (doc.hasOwnProperty(key)) {
            output += `<div class="wrap">` +
                `<label for="${key}">${key}</label>` +
                `<input type="text" name="${key}" id="${key}" value="${doc[key]}">` +
                `</div>`
        }
    }

    output += `</div>` +
        `</div>` +
        `</div>` +
        `<button  class="btn" id="saveconfig">Save Changes</button>` +
        `</div>`

    pageContent.innerHTML = output
    functions.inputStyle()
}

function saveSiteConfig(){
    let config = {}
    var children = document.querySelectorAll('.siteConfig .wrap input')

    children.forEach(function(item){
        let key = item.id
        let val = item.value 
        config[key] = val
    })

    // console.log(config)

    const newConfig = yaml.safeDump(config)
    // console.log(newConfig)
    fs.writeFile(siteConfigPath, newConfig, 'utf8', function (err) {
        if (err) return console.log(err);
    });
    alert('File Updated')
}
