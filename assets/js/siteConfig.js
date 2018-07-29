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
let siteConfigPath = ''

if (store.has('currentProjectPath')){
    configPath = store.get('currentProjectPath').toString()
    siteConfigPath = path.join(configPath, '_config.yml')
}

document.querySelector('.nav-config').addEventListener('click', function(e){
    let others = document.querySelector('.sidenav span.active')
    let el = e.target
    others.classList.remove("active")
    el.classList.add("active")
    generateSiteConfig()
})

pageContent.addEventListener('click', function(e){
    if (e.target && e.target.id == 'edit-site-config') {
        let others = document.querySelector('.sidenav span.active')
        let el = document.querySelector('.nav-config')
        others.classList.remove("active")
        el.classList.add("active")
        generateSiteConfig()
    }
})
pageContent.addEventListener('click', function (e) {
    if (e.target && e.target.id == 'saveconfig') {
        saveSiteConfig()
    }

    if (e.target && e.target.id == 'edit-site-config') {
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
            // console.log(doc[key])
            let isArray = false
            let isObject = false

            if (Array.isArray(doc[key])) {
                isArray = true
            }
            if ((typeof doc[key] === "object") && (doc[key] !== null) && isArray == false) {
                isObject = true
            }
            if(isObject){
                let o = doc[key]
                output += '<div>' +
                        `<input type="text" data-isanobject="${isObject}" name="${key}" id="${key}" value="${key}">`
                for (var k in o) {
                    if (o.hasOwnProperty(k)) {
                        let isArray = false

                        if (Array.isArray(o[k])) {
                            isArray = true
                        }

                        output += `<div class="wrap">` +
                            `<label for="${k}">${k}</label>` +
                            `<input class="objectInput" type="text" data-isanarray="${isArray}" name="${k}" id="${k}" value="${o[k]}">`
                        if (isArray) {
                            output += `<p class="small help">Separate with Comma</p>`
                        }
                        output += `</div>`
                    }
                }
                output += '</div>'
            } else{
                output += `<div class="wrap">` +
                    `<label for="${key}">${key}</label>` +
                    `<input type="text" data-isanarray="${isArray}" data-isanobject="${isObject}" name="${key}" id="${key}" value="${doc[key]}">`
                if (isArray) {
                    output += `<p class="small help">Separate with Comma</p>`
                }
                output += `</div>`
            }
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
    var children = document.querySelectorAll('.siteConfig div > input')

    children.forEach(function(item){
        let key = item.id
        let val = item.value

        if (item.dataset.isanarray == 'true') {
            val = item.value.split(',')
        }
        if(item.dataset.isanobject == 'true'){
            val = {}
            let items = item.parentNode.childNodes
            // console.log(items)
            items.forEach(function(child){
                ch = child.childNodes
                // console.log(ch)
                ch.forEach(function(c){
                    if (c.classList.contains('objectInput')){
                        k = c.id
                        v = c.value
                        val[k] = v
                    }
                })
            })
            // console.log(val)
        }
        if(!item.classList.contains('objectInput')){
            config[key] = val
        }
    })

    // console.log(config)

    const newConfig = yaml.safeDump(config)
    // console.log(newConfig)
    fs.writeFile(siteConfigPath, newConfig, 'utf8', function (err) {
        if (err) return console.log(err);
    });
    ipcRenderer.send('show-message-box', 'none', 'File Updated', 'Configuration File was sucessfully updated')
}
