const fs = require('fs')
const path = require('path')
const prefs = require('./prefs')
const functions = require("./functions.js")
const yaml = require('js-yaml');

const Editor = require('../../node_modules/tui-editor')
let editor

let store = prefs.store

const {
    ipcRenderer,
    remote,
    shell
} = require('electron');
let configPath = ''
if (store.has('configFilePath')) {
    configPath = store.get('configFilePath')
}
let config = {}
let fS = {}

let pageContent = document.querySelector('.container')
let popupContent = document.querySelector('.popup .content-loader')
let pagesPath 
let mediaFolder

if(store.has('currentProjectPath')){
    pagesPath = path.join(store.get('currentProjectPath').toString())
    mediaFolder = path.join(store.get('currentProjectPath').toString(), 'assets')
}

let mediaFiles = {}

const mediaLibraryPath = functions.htmlPath('medialib')

document.querySelector('.nav-pages').addEventListener('click', function (e) {
    let others = document.querySelector('.sidenav span.active')
    let el = e.target
    others.classList.remove("active")
    el.classList.add("active")
    if (store.has('currentPageEditPath')) {
        pageEditor(store.get('currentPageEditPath'))
    } else {
        generatePagesList()
    }
})

function generatePagesList(){
    let allPages = functions.getPages(pagesPath)
    functions.generateFilesList(allPages, 'page', pageContent)
}

pageContent.addEventListener('click', function (e) {
    if (e.target && e.target.classList.contains('duplicate-page')) {
        functions.duplicateFile(e.target, 'pagepath')
        generatePagesList()
    }

    if (e.target && e.target.classList.contains('delete-page')) {
        functions.moveToTrash(e.target, 'pagepath')
        generatePagesList()
    }

    if (e.target && e.target.classList.contains('edit-page')) {
        let el = e.target
        let oP = el.dataset.pagepath
        pageEditor(oP)
    }

    if (e.target && e.target.id == 'create-new-page') {
        let el = e.target
        pageCreator()
    }
})

function pageEditor(filePath){
    if (store.has('currentPageEditPath')) {
        store.get('currentPageEditPath')
    } else {
        store.set('currentPageEditPath', filePath)
    }
    let currentPath = store.get('currentPageEditPath')
    let content = fs.readFileSync(currentPath.toString(), 'utf8')
    let bla = content.split('---')
    let yml = bla[1]
    let p = yaml.load(yml)
    let html = ''
    fS = {}
    editor = ''

    fs.readFile(configPath.toString(), (err, data) => {
        if (err) throw err
        let config = JSON.parse(data)
        fS = config.frontMatterSettings

        html += `<div class="middle pageContents">
                    <h1><span>Edit Page</span></h1>
                    <div class="cards-alt">
                        <div class="main">
                            <div class="card">
                                <div class="card-content">`
        if (!fS) {
            html += `<div class="wrap">
                <label for="title">Title</label>
                <input type="text" name="title" id="title">
            </div>`
        } else {
            for (let sets in fS) {
                if (fS.hasOwnProperty(sets)) {
                    if (fS[sets].area == 'main') {
                        // console.log(`${sets} belongs in main area`)
                        html += functions.generateMeta('page', fS, sets, p[sets])
                    }
                }
            }
        }

        html += `       <div class="wrap">
                            <label for="edit-content" class="up">Content</label>
                            <div id="editSection"></div>
                        </div>
                    </div>
                </div>
            </div>`

        html += `<div class="secondary">
                    <div class="card">
                        <div class="card-content">`
        if(!fS){
            html += `<p><i class="fas fa-exclamation-circle"></i> It seems like you don't have any Front Matter Configuration set up. You're Data Editing Experience can be better. <a href="#">learn more on how to configure.</a></p>`
            for (var key in p) {
                if (key != 'title') {
                    if (p.hasOwnProperty(key)) {
                        html += `<div class="wrap">` +
                            `<label for="${key}">${key}</label>` +
                            `<input type="text" name="${key}" id="${key}" value="${p[key]}">` +
                            `</div>`
                    }
                }
            }
        } else {
            for (let sets in fS) {
                if (fS.hasOwnProperty(sets)) {
                    if (fS[sets].area != 'main') {
                        html += functions.generateMeta('page', fS, sets, p[sets])
                    }
                }
            }
        }
        html +=
                    `
                        </div>
                    </div>
                </div>
            </div>
            <button class="btn disabled">Preview</button>
            <button class="btn" id="save-page-edit">Save Page</button>
            <button class="btn" id="save-page-draft-edit">Save Draft</button>
            <button class="btn" id="delete-page-edit">Delete Page</button>
            <button class="btn" id="cancel-page-edit">Cancel</button>
        </div>`
        pageContent.innerHTML = html
        editor = new Editor({
            el: document.querySelector('#editSection'),
            initialValue: bla[2],
            initialEditType: 'wysiwyg',
            previewStyle: 'tab',
            height: '900px'
        });
        functions.inputStyle()
    })

    pageContent.addEventListener('click', function (e) {
        if (e.target && e.target.id == 'cancel-page-edit') {
            let el = e.target
            if(confirm('Are you sure you want to cancel? All changes will be lost?')){
                store.delete('currentPageEditPath')
                generatePagesList();
            }
        }
        if (e.target && e.target.id == 'save-page-draft-edit') {
            let el = e.target
            savePageDraft(currentPath, editor)
        }
        if (e.target && e.target.id == 'save-page-edit') {
            let el = e.target
            savePage(currentPath, editor)
        }

        if (e.target && e.target.id == 'delete-page-edit') {
            let el = e.target
            if (confirm(`Are you sure you want to delete ${currentPath}?`)) {
                if (shell.moveItemToTrash(currentPath)) {
                    ipcRenderer.send('show-message-box', 'none', 'Page Deleted', `${currentPath} was successfully moved to the trash.`)
                }
            }
            generatePagesList()
        }

    })
}

function pageCreator() {
    let html = ''
    fS = {}
    fs.readFile(configPath.toString(), (err, data) => {
        if (err) throw err
        let config = JSON.parse(data)
        fS = config.frontMatterSettings

        html += `<div class="middle pageContents">
                    <h1><span>Create Page</span></h1>
                    <div class="cards-alt">
                        <div class="main">
                            <div class="card">
                                <div class="card-content">`
        if (!fS) {
            html += `<div class="wrap">
                        <label for="title">Title</label>
                        <input type="text" name="title" id="title">
                    </div>`
        } else {
            for (let sets in fS) {
                if (fS.hasOwnProperty(sets)) {
                    if (fS[sets].area == 'main') {
                        // console.log(`${sets} belongs in main area`)
                        html += functions.generateMeta('page', fS, sets)
                    }
                }
            }
        }

        html += `       <div class="wrap">
                            <label for="edit-content" class="up">Content</label>
                            <div id="editSection"></div>
                        </div>
                    </div>
                </div>
            </div>`

        html += `<div class="secondary">
                    <div class="card">
                        <div class="card-content">`
        if (!fS) {
            html += `<p><i class="fas fa-exclamation-circle"></i> It seems like you don't have any Front Matter Configuration set up. You're Data Editing Experience can be better. <a href="#">learn more on how to configure.</a></p>`
        } else {
            for (let sets in fS) {
                if (fS.hasOwnProperty(sets)) {
                    if (fS[sets].area != 'main') {
                        html += functions.generateMeta('page', fS, sets)
                    }
                }
            }
        }
        html +=
            `
                        </div>
                    </div>
                </div>
            </div>
            <button class="btn disabled">Preview</button>
            <button class="btn" id="save-page-new">Save Page</button>
            <button class="btn" id="save-page-draft-new">Save Draft</button>
            <button class="btn" id="cancel-page-new">Cancel</button>
        </div>`
        pageContent.innerHTML = html
        editor = new Editor({
            el: document.querySelector('#editSection'),
            initialEditType: 'wysiwyg',
            previewStyle: 'tab',
            height: '900px'
        });
        functions.inputStyle()
    })

    pageContent.addEventListener('click', function (e) {
        if (e.target && e.target.id == 'cancel-page-new') {
            let el = e.target
            if (confirm('Are you sure you want to cancel? All changes will be lost?')) {
                generatePagesList();
            }
        }
        if (e.target && e.target.id == 'save-page-draft-new') {
            let el = e.target
            savePageDraft(false, editor)
        }
        if (e.target && e.target.id == 'save-page-new') {
            let el = e.target
            savePage(false, editor)
        }
    })
}

function createFileContent(draft, editor){
    let config = {}
    let title = document.querySelector('#title').value
    let newpagePath = path.join(pagesPath, `${functions.slugify(title)}.md`)

    if(draft){
        config.published = false
    } else {
        config.published = true
    }

    if(!fS) {
        datas = document.querySelectorAll('.pageContents .wrap > input')
        datas.forEach(function (item) {
            let key = item.id
            let val = item.value
            config[key] = val
        })
    } else {
        for (let sets in fS) {
            if (fS.hasOwnProperty(sets)) {
                functions.retrieveMeta('page', fS, sets, config)
            }
        }
    }

    output = `---\n`
    output += yaml.safeDump(config)
    output += `---\n`
    output += editor.getMarkdown()

    // console.log(output)

    fs.writeFile(newpagePath, output, 'utf8', function (err) {
        if (err) return console.log(err);
    });
}

function savePage(filePath, editor) {
    // delete old file
    if(filePath != false){
        functions.deleteFile(filePath.toString())
        store.delete('currentPageEditPath')
    }     
    createFileContent(false, editor)
    alert('Page Saved')
}

function savePageDraft(filePath, editor) {
    // delete old file
    if (filePath != false) {
        functions.deleteFile(filePath.toString())
        store.delete('currentPageEditPath')
    }
    createFileContent(true, editor)
    alert('Draft Saved')
}

// pageContent.addEventListener('click', function (e) {
//     if (e.target && e.target.id == 'add-media') {
//         let el = e.target
//         functions.loadMediaGallery(mediaLibraryPath, popupContent, mediaFolder, editor)
//     }
// })