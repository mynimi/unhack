const fs = require('fs')
const path = require('path')
const prefs = require('./prefs')
const functions = require("./functions.js")
const yaml = require('js-yaml')
let store = prefs.store
const dragula = require('../../node_modules/dragula/dist/dragula.js')

const {
    ipcRenderer,
    remote
} = require('electron');

let pageContent = document.querySelector('.container')
let pageLinks = ''
let menuArea = ''
let menuDataPath = ''

const pagesPath = store.get('currentProjectPath')


document.querySelector('.nav-navigation').addEventListener('click', function (e) {
    let others = document.querySelector('.sidenav span.active')
    let el = e.target
    others.classList.remove("active")
    el.classList.add("active")
    navigationBuilder()
})

function navigationBuilder() {
    menuDataPath = path.join(store.get('currentProjectPath').toString(), '_data', 'menu.yml')
    let configPath = store.get('configFilePath')

    const config = fs.readFileSync(configPath)
    const c = JSON.parse(config)
    // console.log(c)

    // if(c.menuSupport){
    //     // yay menu supported by theme
    // } else {
    //     functions.displayAlert('error', 'No Navigation Builder Support', "Seems like your Theme doesn't support the Navigation Builder. Contact the Theme Developer or read the Documentation to learn how to add Menu Support to a jekyll theme.")
    // }

    if (fs.existsSync(menuDataPath)) {
        let menuData = yaml.safeLoad(fs.readFileSync(menuDataPath, 'utf8'));
        // console.log(menuData)
        nav = menuData.dropdown
        menuArea = `<div class="areas menu-areas">`
        for (var i = 0; i < nav.length; i++) {
            menuArea += `<div class="area area${i+1}">
                        <div class="placeholder">Drag Element inside</div>`
            menuArea += `<div class="menu-element draggable"><span class="title" ${(nav[i].url) ? `data-navurl="${nav[i].url}"` : ''}>${nav[i].title}</span></div>`
            if (nav[i].children) {
                let children = nav[i].children
                for (var j = 0; j < children.length; j++) {
                    menuArea += `<div class="menu-element draggable"><span class="title" data-navurl="${children[j].url}">${children[j].title}</span></div>`
                }
            }
            menuArea += `</div>`
            //Do something
        }
        menuArea += `</div>`
    } else {
        menuArea = `<div class="areas menu-areas">
                    <div class="area area1">
                        <div class="placeholder">Drag Element inside</div>
                    </div>
                    <div class="area area2">
                        <div class="placeholder">Drag Element inside</div>
                    </div>
                    <div class="area area3">
                        <div class="placeholder">Drag Element inside</div>
                    </div>
                    <div class="area area4">
                        <div class="placeholder">Drag Element inside</div>
                    </div>
                    <div class="area area5">
                        <div class="placeholder">Drag Element inside</div>
                    </div>
                    <div class="area area6">
                        <div class="placeholder">Drag Element inside</div>
                    </div>
                    <div class="area area7">
                        <div class="placeholder">Drag Element inside</div>
                    </div>
                </div>`
    }
    let output = `<h1><span>Build Your Menu</span></h1>`
        if(!c.menuSupport){
            output += `<div class="alert error"><div class="alert-content">
                <i class="fas fa-times-circle fa-2x fa-pull-left"></i>
                <h1 class="alert-title"><span>No Navigation Support</span></h1>
                <div class="alert-message">Seems like your Theme doesn 't support the Navigation Builder. Contact the Theme Developer or read the <a href="https://unhacked.halfapx.com/docs/" class="open-in-browser">Documentation</a> to learn how to add Menu Support to a jekyll theme.</div>
            </div></div>`
        }
        output += `<div class="cardholder">
                    <div class="card">
                        <div class="card-content">
                            <h2>Available Pages</h2>
                            <div id="available-pages"></div>
                        </div>
                    </div>
                </div>
                <div class="cardholder">
                    <div class="card">
                        <div class="card-content">
                            <h2>Build Your Menu</h2>
                            <p>Drag your Links into the slot. To create Dropdowns, Stack them.</p>
                            <p>Note, that TopLevel Links of Dropdowns, are not funtioning links, they are just toggles.</p>
                            ${menuArea}
                            <p><button class="btn" id="add-drop-area">Add Item Area</button></p>
                        </div>
                    </div>
                </div>
                <button class="btn" id="save-custom-menu">Save Menu</button>`

    pageContent.innerHTML = output

    pageLinks = functions.getPages(pagesPath.toString())
    let availablePages = '<div class="menu-element draggable custom"><input type="text" name="item-name" placeholder="name"><input type="text" name="item-url" placeholder="url"></div>'
    pageLinks.forEach(function (p) {
        let content = fs.readFileSync(p.toString(), 'utf8')
        let bla = content.split('---')
        let yml = bla[1]
        let data = yaml.load(yml)

        let url = `/${path.parse(path.basename(p.toString())).name}/`
        if (data.permalink) {
            url = data.permalink
        } else if (data.title == 'index' || data.title == 'Index') {
            url = '/'
        }

        availablePages += `<div class="menu-element draggable"><span class="title" data-navurl="${url}">${data.title}</span></div>`
        functions.inputStyle()
    })

    document.querySelector('#available-pages').innerHTML = availablePages

    dragula([document.getElementById('available-pages')], {
        isContainer: function (el) {
            return el.classList.contains('area');
        },
        removeOnSpill: true,
        copy: function (el, source) {
            return source === document.getElementById('available-pages')
        },
        accepts: function (el, target) {
            return target !== document.getElementById('available-pages')
        }
    })
}

 pageContent.addEventListener('click', function (e) {
     let menuAreas = document.querySelector('.menu-areas')

     if (e.target && e.target.id == 'add-drop-area') {
         let count = menuAreas.childElementCount
         let el = e.target
         menuAreas.insertAdjacentHTML('beforeend', `<div class="area area${count+1}"><div class="placeholder">Drag Element inside</div></div>`)
     }

     if (e.target && e.target.id == 'save-custom-menu') {
         let navFile = {}
         let dropdown = []
         let count = menuAreas.childElementCount

         for (var i = 0; i < count; i++) {
             let area = document.querySelector(`.area${i+1}`)
             let el = {}
             // console.log(area.childElementCount)
             if (area.childElementCount > 1) {
                 if (area.childElementCount > 2) {
                     let items = document.querySelectorAll(`.area${i+1} .menu-element`)
                     let children = []
                     items.forEach(function (elem, index) {
                         let i = index
                         let child = {}
                         if (i == 0) {
                             if (elem.querySelector('span')) {
                                 // console.log('is span')
                                 el.title = elem.querySelector('span').textContent
                                 el.children = children
                             } else {
                                 // console.log('is not span')
                                 el.title = elem.querySelector(`input[name="item-name"]`).value
                             }
                         } else {
                             if (elem.querySelector('span')) {
                                 child.title = elem.querySelector('span').textContent
                                 child.url = elem.querySelector('span').dataset.navurl
                             } else {
                                 child.title = elem.querySelector(`input[name="item-name"]`).value
                                 child.url = elem.querySelector(`input[name="item-url"]`).value
                             }
                             // child.title = elem.textContent
                             // child.url = elem.dataset.navurl
                             children.push(child)
                         }
                     })
                 } else {
                     if (document.querySelector(`.area${i+1} .custom`)) {
                         // console.log('has a custom link')
                         el.title = document.querySelector(`.area${i+1} .custom input[name="item-name"]`).value
                         el.url = document.querySelector(`.area${i+1} .custom input[name="item-url"]`).value
                     } else {
                         // console.log('has not a custom link')
                         let item = document.querySelector(`.area${i+1} span`)
                         el.title = item.textContent
                         el.url = item.dataset.navurl
                     }
                 }
                 dropdown.push(el)
             }
         }

         navFile.dropdown = dropdown
         // console.log(navFile)
         let newMenuFile = yaml.safeDump(navFile, {
             skipInvalid: true
         })
         fs.writeFile(menuDataPath, newMenuFile, 'utf8', function (err) {
             if (err) {
                 return console.log(err);
             } else {
                 navigationBuilder()
                 ipcRenderer.send('show-message-box', 'none', 'Menu Saved', "Menu Data File was successfully saved.")

             }
         });
     }
 })