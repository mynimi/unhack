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

let configPath = ''
if (store.has('currentProjectPath')){
    configPath = store.get('currentProjectPath').toString()
}

const siteConfigPath = path.join(configPath, '_config.yml')

document.querySelector('.nav-config').addEventListener('click', function(e){
    let others = document.querySelector('.sidenav span.active')
    let el = e.target
    others.classList.remove("active")
    el.classList.add("active")
    generateSiteConfig()
})

function generateSiteConfig(){
    pageContent.addEventListener('click', function (e) {
        if (e.target && e.target.id == 'saveconfig') {
            saveSiteConfig()
        }

        if (e.target && e.target.id == 'edit-site-config') {
            generateSiteConfig()
        }
    })

    let doc = {}

    // Get document, or throw exception on error
    try {
        doc = yaml.safeLoad(fs.readFileSync(siteConfigPath, 'utf8'));
        console.log(doc);
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
            console.log(doc[key])
            let isArray = false
            if (Array.isArray(doc[key])) {
                isArray = true
            }
            output += `<div class="wrap">` +
                `<label for="${key}">${key}</label>` +
                `<input type="text" data-isanarray="${isArray}" name="${key}" id="${key}" value="${doc[key]}">`
            if(isArray){
                output += `<p class="small help">Separate with Comma</p>`
            }
            output += `</div>`
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

        if (item.dataset.isanarray == 'true') {
            val = item.value.split(',')
        }
        config[key] = val
    })

    console.log(config)

    const newConfig = yaml.safeDump(config)
    console.log(newConfig)
    fs.writeFile(siteConfigPath, newConfig, 'utf8', function (err) {
        if (err) return console.log(err);
    });
    alert('File Updated')
}
