const fs = require('fs')
const path = require('path')
const shell = require('shelljs')
const child_process = require('child_process')
const prefs = require('./prefs')
const functions = require("./functions.js")
const yaml = require('js-yaml');

const Editor = require('../../node_modules/tui-editor')
let editor

let store = prefs.store

const {
    ipcRenderer,
    remote
} = require('electron');

const configPath = store.get('configFilePath')
let config = {}
let fS = {}

let pageContent = document.querySelector('.container')
const pagesPath = path.join(store.get('currentProjectPath'))

document.querySelector('.nav-pages').addEventListener('click', function (e) {
    let others = document.querySelector('.sidenav span.active')
    let el = e.target
    others.classList.remove("active")
    el.classList.add("active")
    generatePagesList()
})

function generatePagesList(){
    let allPages = functions.getPages(pagesPath)
    console.log(allPages)

    let output = `<div class="middle">
                    <h1>Pages</h1>
                    <button class="btn" id="create-new-page">Create New Page</button>
                    <div class="cardholder">
                        <div class="card">
                            <div class="card-content">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Filename</th>
                                            <th>Title</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>`
    // iterate through all pages
    allPages.forEach(function(p){
        let content = fs.readFileSync(p.toString(), 'utf8')
        let bla = content.split('---')
        let yml = bla[1]
        let data = yaml.load(yml)
        console.log(data)

        let status;
        if (data.published == false) {
            status = 'Draft'
        } else{
            status = 'Published'
        }
        output +=   `<tr>
                        <td>${path.basename(p.toString())}</td>
                        <td>${data.title}</td>
                        <td>${status}</td>
                        <td>
                            <button class="btn edit-page" data-pagePath="${p}">Edit</button>
                            <button class="btn duplicate-page" data-pagePath="${p}">Duplicate</button>
                            <button class="btn delete-page" data-pagePath="${p}">Delete</button>
                        </td>
                    </tr>`
    })
    output += `</tbody></table></div></div></div></div>`

    pageContent.innerHTML = output
    // functions.inputStyle()

}

pageContent.addEventListener('click', function (e) {
    if (e.target && e.target.classList.contains('duplicate-page')) {
        let el = e.target
        let oP = el.dataset.pagepath
        let insert = "_copy";
        let position = oP.lastIndexOf('.');
        let nP = oP.substr(0, position) + insert + oP.substr(position);
        functions.copyFile(oP, nP, function(){generatePagesList()})
        alert('copied')
    }

    if (e.target && e.target.classList.contains('delete-page')) {
        let el = e.target
        let oP = el.dataset.pagepath
        if(confirm(`Are you sure you want to delete ${oP}?`)){
            fs.unlink(oP, (err) => {
                if (err) throw err;
                generatePagesList()
                alert(`${oP} was deleted`)
            });
        }
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
    let content = fs.readFileSync(filePath.toString(), 'utf8')
    let bla = content.split('---')
    let yml = bla[1]
    let p = yaml.load(yml)
    let html = ''
    fS = {}

    fs.readFile(configPath.toString(), (err, data) => {
        if (err) throw err
        let config = JSON.parse(data)
        fS = config.frontMatterSettings

        html += `<div class="middle pageContents">
                    <h1>Edit Page</h1>
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
                        console.log(`${sets} belongs in main area`)
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
            <button class="btn">Preview</button>
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
            height: '500px'
        });
        functions.inputStyle()
    })

    pageContent.addEventListener('click', function (e) {
        if (e.target && e.target.id == 'cancel-page-edit') {
            let el = e.target
            if(confirm('Are you sure you want to cancel? All changes will be lost?')){
                generatePagesList();
            }
        }
        if (e.target && e.target.id == 'save-page-draft-edit') {
            let el = e.target
            savePageDraft(filePath, editor)
        }
        if (e.target && e.target.id == 'save-page-edit') {
            let el = e.target
            savePage(filePath, editor)
        }

        if (e.target && e.target.id == 'delete-page-edit') {
            let el = e.target
            alert('delete')
            if (confirm(`Are you sure you want to delete ${filePath}?`)) {
                fs.unlink(filePath, (err) => {
                    if (err) throw err;
                    generatePagesList()
                    alert(`${filePath} was deleted`)
                });
            }
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
                    <h1>Create Page</h1>
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
                        console.log(`${sets} belongs in main area`)
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
            <button class="btn">Preview</button>
            <button class="btn" id="save-page-edit">Save Page</button>
            <button class="btn" id="save-page-draft-edit">Save Draft</button>
            <button class="btn" id="cancel-page-edit">Cancel</button>
        </div>`
        pageContent.innerHTML = html
        editor = new Editor({
            el: document.querySelector('#editSection'),
            initialEditType: 'wysiwyg',
            previewStyle: 'tab',
            height: '500px'
        });
        functions.inputStyle()
    })

    pageContent.addEventListener('click', function (e) {
        if (e.target && e.target.id == 'cancel-page-edit') {
            let el = e.target
            if (confirm('Are you sure you want to cancel? All changes will be lost?')) {
                generatePagesList();
            }
        }
        if (e.target && e.target.id == 'save-page-draft-edit') {
            let el = e.target
            savePageDraft(false, editor)
        }
        if (e.target && e.target.id == 'save-page-edit') {
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
    output += editor.getValue()

    console.log(output)

    fs.writeFile(newpagePath, output, 'utf8', function (err) {
        if (err) return console.log(err);
    });
}

function savePage(filePath, editor) {
    // delete old file
    if(filePath){
        functions.deleteFile(filePath)
    }    
    createFileContent(false, editor)
    alert('Page Saved')
}

function savePageDraft(filePath, editor) {
    // delete old file
    if (filePath) {
        functions.deleteFile(filePath)
    }
    createFileContent(true, editor)
    alert('Draft Saved')
}

