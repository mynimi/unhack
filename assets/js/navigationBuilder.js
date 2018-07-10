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
const pagesPath = store.get('currentProjectPath')

const menuDataPath = path.join(store.get('currentProjectPath'), '_data', 'menu.yml')


document.querySelector('.nav-navigation').addEventListener('click', function (e) {
    let others = document.querySelector('.sidenav span.active')
    let el = e.target
    others.classList.remove("active")
    el.classList.add("active")
    navigationBuilder()
})

function navigationBuilder() {
    pageContent.addEventListener('click', function (e) {
        let menuAreas = document.querySelector('.menu-areas')
        let count = menuAreas.childElementCount

        if (e.target && e.target.id == 'add-drop-area') {
            let el = e.target
            menuAreas.insertAdjacentHTML('beforeend', `<div class="area area${count+1}"><div class="placeholder">Drag Element inside</div></div>`)
        }

        if (e.target && e.target.id == 'save-custom-menu') {
            let navFile = {}
            let dropdown = []

            for (var i = 0; i < count; i++) {
                let area = document.querySelector(`.area${i+1}`)
                let el = {}
                console.log(area.childElementCount)
                if (area.childElementCount > 1) {
                    if (area.childElementCount > 2) {
                        let items = document.querySelectorAll(`.area${i+1} span`)
                        let children = []
                        items.forEach(function (elem, index) {
                            let i = index
                            let child = {}
                            if (i == 0) {
                                el.title = elem.textContent
                                el.children = children
                            } else {
                                child.title = elem.textContent
                                child.url = elem.dataset.navurl
                                children.push(child)
                            }
                        })
                    } else {
                        let item = document.querySelector(`.area${i+1} span`)
                        el.title = item.textContent
                        el.url = item.dataset.navurl
                    }
                    dropdown.push(el)
                }
            }

            navFile.dropdown = dropdown
            console.log(navFile)
            let newMenuFile = yaml.safeDump(navFile, {
                skipInvalid: true
            })
            fs.writeFile(menuDataPath, newMenuFile, 'utf8', function (err) {
                if (err) {
                    return console.log(err);
                } else {
                    navigationBuilder()
                    alert('New Menu Saved')
                }
            });
        }
    })

    if (fs.existsSync(menuDataPath)) {
        let menuData = yaml.safeLoad(fs.readFileSync(menuDataPath, 'utf8'));
        console.log(menuData)
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
    let output = `<h1><span>Build Your Menu</span></h1>
                <div class="cardholder">
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

    pageLinks = functions.getPages(pagesPath)
    let availablePages = ''
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