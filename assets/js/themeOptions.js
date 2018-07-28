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
let themeConfigPath = ''
let tO = ''
let sassFilePath = ''
let useDefault = false

if (store.has('currentProjectPath')){
    configPath = store.get('currentProjectPath').toString()
    siteConfigPath = path.join(configPath, '_config.yml')
}
if(store.has('configFilePath')){
    themeConfigPath = store.get('configFilePath')
}

document.querySelector('.nav-theme').addEventListener('click', function(e){
    let others = document.querySelector('.sidenav span.active')
    let el = e.target
    others.classList.remove("active")
    el.classList.add("active")
    generateThemeOptions(useDefault = false)
})

pageContent.addEventListener('click', function(e){
    if (e.target && e.target.id == 'edit-theme-options') {
        let others = document.querySelector('.sidenav span.active')
        let el = document.querySelector('.nav-config')
        others.classList.remove("active")
        el.classList.add("active")
        generateThemeOptions(useDefault = false)
    }
})
function generateThemeOptions(useDefault) {
    let output = ''

    pageContent.addEventListener('click', function (e) {
        if (e.target && e.target.id == 'save-theme-options') {
            saveThemeOptions()
        }

        if (e.target && e.target.id == 'reset-theme-options') {
            generateThemeOptions(useDefault = true)
            ipcRenderer.send('show-message-box', 'none', 'Defaults Restored', 'Defaults have been restored, hit Save to keep these changes.')
        }
    })

    fs.readFile(themeConfigPath.toString(), (err, data) => {
        if(err) throw err
        let config = JSON.parse(data)
        tO = config.themeOptions
        sassFilePath = config.themeOptionsPath

        output = `<div class="middle">
                    <h1><span>Theme Options</span></h1>
                    `
        if(!tO){
            output += `<div class="alert error"><div class="alert-content">
                <i class="fas fa-times-circle fa-2x fa-pull-left"></i>
                <h1 class="alert-title"><span>No Theme Option Support</span></h1>
                <div class="alert-message">Your Theme does not seem to have Theme Options configured. Contact the Theme Developer or read the Documentation to learn how to add Theme Support to a jekyll theme.</div>
            </div></div>`
        } else {
            for (let section in tO) {
                if (tO.hasOwnProperty(section)) {
                    output += `<div class="cardholder columns">
                                <div class="card">
                                <div class="card-content">
                                    <h2>${section.toProperCase()}</h2>`
                    let vars = tO[section].vars
                    // console.log(vars)
                    for(let prop in vars){
                        if(vars[prop].value && useDefault != true){
                            // console.log('has value')
                            output += functions.generateOptions('global', vars, prop, vars[prop].value)
                        } else {
                            // console.log('use default')
                            output += functions.generateOptions('global', vars, prop, vars[prop].default)
                        }
                        // output += prop
                        // output += prop
                        // output += vars[prop].default
                    }
                    output +=`</div>
                            </div>`
                }
            }
        }
        output += `</div>
        <button class="btn" id="save-theme-options">Save Theme Options</button>
        <button class="btn btn-scnd" id="reset-theme-options">Reset to Default</button>
        </div>`

        pageContent.innerHTML = output
        functions.inputStyle()

    })
}

function saveThemeOptions(){
    let configuration = []
    for (let section in tO) {
        if (tO.hasOwnProperty(section)) {
            let config = {}
            let string = []
            let vars = tO[section].vars
            for (let prop in vars) {
                functions.retrieveOptions('global', vars, prop, config)
                vars[prop].value = config[prop]
                if(vars[prop].type == 'image'){
                    string.push(`$${prop}: '${config[prop]}';`)
                } else {
                    string.push(`$${prop}: ${config[prop]};`)
                }
                // console.log(vars[prop])
            }
            configuration.push(string)
        }
    }

    // update config file with values
    fs.readFile(themeConfigPath.toString(), (err, data) => {
        if (err) throw err
        let config = JSON.parse(data)
        delete config.themeOptions
        config.themeOptions = tO
        fs.writeFile(themeConfigPath.toString(), JSON.stringify(config, null, 2), (err) => {
            if (err) throw err
            ipcRenderer.send('show-message-box', 'none', 'Settings Saved', "Settings were sucessfully saved to Config File.")
            generateThemeOptions();
        })
    })

    let sassArray = [].concat(...configuration);
    sass = ''
    for (let i = 0; i < sassArray.length; i++){
        sass += `${sassArray[i]}\n`
    }
    let location = path.join(configPath, sassFilePath)

    fs.writeFile(location, sass, 'utf8', function (err) {
        if (err) return console.log(err);
        // ipcRenderer.send('show-message-box', 'none', 'File Saved', 'Sass Theme Options File was sucessfully updated.')
    });

    // let config = {}
    // var children = document.querySelectorAll('.siteConfig div > input')

    // children.forEach(function(item){
    //     let key = item.id
    //     let val = item.value

    //     if (item.dataset.isanarray == 'true') {
    //         val = item.value.split(',')
    //     }
    //     if(item.dataset.isanobject == 'true'){
    //         val = {}
    //         let items = item.parentNode.childNodes
    //         // console.log(items)
    //         items.forEach(function(child){
    //             ch = child.childNodes
    //             // console.log(ch)
    //             ch.forEach(function(c){
    //                 if (c.classList.contains('objectInput')){
    //                     k = c.id
    //                     v = c.value
    //                     val[k] = v
    //                 }
    //             })
    //         })
    //         // console.log(val)
    //     }
    //     if(!item.classList.contains('objectInput')){
    //         config[key] = val
    //     }
    // })

    // // console.log(config)

    // const newConfig = yaml.safeDump(config)
    // // console.log(newConfig)
    // fs.writeFile(siteConfigPath, newConfig, 'utf8', function (err) {
    //     if (err) return console.log(err);
    // });
    // ipcRenderer.send('show-message-box', 'none', 'File Updated', 'Configuration File was sucessfully updated')
}
