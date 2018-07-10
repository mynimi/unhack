const fs = require('fs')
const path = require('path')
const prefs = require('./prefs')
const functions = require("./functions.js")
let store = prefs.store
const dragula = require('../../node_modules/dragula/dist/dragula.js')

const {
    ipcRenderer,
    remote
} = require('electron');

let pageContent = document.querySelector('.container')
let pageLinks = ''
const pagesPath = path.join(store.get('currentProjectPath'))

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
                            <div class="areas menu-areas">
                                <div class="area area1 ui-droppable ui-sortable">
                                    <div class="placeholder">Drag Element inside</div>
                                </div>
                                <div class="area area2 ui-droppable ui-sortable">
                                    <div class="placeholder">Drag Element inside</div>
                                </div>
                                <div class="area area3 ui-droppable ui-sortable">
                                    <div class="placeholder">Drag Element inside</div>
                                </div>
                                <div class="area area4 ui-droppable ui-sortable">
                                    <div class="placeholder">Drag Element inside</div>
                                </div>
                                <div class="area area5 ui-droppable ui-sortable">
                                    <div class="placeholder">Drag Element inside</div>
                                </div>
                                <div class="area area6 ui-droppable ui-sortable">
                                    <div class="placeholder">Drag Element inside</div>
                                </div>
                                <div class="area area7 ui-droppable ui-sortable">
                                    <div class="placeholder">Drag Element inside</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="btn" id="save-custom-menu">Save Menu</button>`

document.querySelector('.nav-navigation').addEventListener('click', function (e) {
    let others = document.querySelector('.sidenav span.active')
    let el = e.target
    others.classList.remove("active")
    el.classList.add("active")
    pageContent.innerHTML = output

    pageLinks = functions.getPages(pagesPath)
    let availablePages = ''
    pageLinks.forEach(function(p){
        let content = fs.readFileSync(p.toString(), 'utf8')
        let bla = content.split('---')
        let yml = bla[1]
        let data = yaml.load(yml)

        let url = `/${path.parse(path.basename(p.toString())).name}/`
        if (data.permalink) {
            url = data.permalink
        } else if(data.title == 'index' || data.title == 'Index'){
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

    // dragula([document.getElementById('available-pages'), document.querySelectorAll('.area')]);
})
