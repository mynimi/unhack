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
    remote
} = require('electron');

const configPath = store.get('configFilePath')
let config = {}
let fS = {}

let pageContent = document.querySelector('.container')
let popupContent = document.querySelector('.popup .content-loader')
const postsPath = path.join(store.get('currentProjectPath'), '_posts')
const draftsPath = path.join(store.get('currentProjectPath'), '_drafts')
const mediaFolder = path.join(store.get('currentProjectPath'), 'assets')

let mediaFiles = {}

const mediaLibraryPath = functions.htmlPath('medialib')

document.querySelector('.nav-posts').addEventListener('click', function (e) {
    let others = document.querySelector('.sidenav span.active')
    let el = e.target
    others.classList.remove("active")
    el.classList.add("active")
    if(store.has('currentPostEditPath')){
        postEditor(store.get('currentPostEditPath'))
    } else{
        generatePostsList()
    }
})

function generatePostsList(){
    let postPathList = functions.getPathsInDir(postsPath.toString())
    let draftPathList = functions.getPathsInDir(draftsPath.toString())
    let allPosts = [...draftPathList, ...postPathList]

    let output = `<div class="middle">
                    <h1><span>Posts</span></h1>
                    <button class="btn" id="create-new-post">Create New Post</button>
                    <div class="cardholder">
                        <div class="card">
                            <div class="card-content">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Filename</th>
                                            <th>Title</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>`
    // iterate through all posts
    allPosts.forEach(function(p){
        let content = fs.readFileSync(p.toString(), 'utf8')
        let bla = content.split('---')
        let yml = bla[1]
        let data = yaml.load(yml)
        // console.log(data)
        let date = ''
        if(data.date){
            date = functions.changeDateFormat(data.date)
        }
        
        let status;
        if(p.includes('_drafts')){
            status = 'Draft'
        } else{
            status = 'Published'
        }
        output +=   `<tr>
                        <td>${path.basename(p.toString())}</td>
                        <td>${data.title}</td>
                        <td>${date}</td>
                        <td>${status}</td>
                        <td>
                            <button class="btn edit-post" data-postPath="${p}">Edit</button>
                            <button class="btn duplicate-post" data-postPath="${p}">Duplicate</button>
                            <button class="btn delete-post" data-postPath="${p}">Delete</button>
                        </td>
                    </tr>`
    })
    output += `</tbody></table></div></div></div></div>`

    pageContent.innerHTML = ''
    pageContent.innerHTML = output
    // functions.inputStyle()

}

pageContent.addEventListener('click', function (e) {
    if (e.target && e.target.classList.contains('duplicate-post')) {
        let el = e.target
        let oP = el.dataset.postpath
        let insert = "_copy";
        let position = oP.lastIndexOf('.');
        let nP = oP.substr(0, position) + insert + oP.substr(position);
        functions.copyFile(oP, nP, function(){generatePostsList()})
        alert('copied')
    }

    if (e.target && e.target.classList.contains('delete-post')) {
        let el = e.target
        let oP = el.dataset.postpath
        if(confirm(`Are you sure you want to delete ${oP}?`)){
            fs.unlink(oP, (err) => {
                if (err) throw err;
                generatePostsList()
                alert(`${oP} was deleted`)
            });
        }
    }

    if (e.target && e.target.classList.contains('edit-post')) {
        let el = e.target
        let oP = el.dataset.postpath
        postEditor(oP)
    }

    if (e.target && e.target.id == 'create-new-post') {
        let el = e.target
        postCreator()
    }
})

function postEditor(filePath){
    if(store.has('currentPostEditPath')){
        store.get('currentPostEditPath')
    } else {
        store.set('currentPostEditPath', filePath)
    }
    let currentPath = store.get('currentPostEditPath')
    let content = fs.readFileSync(currentPath.toString(), 'utf8')
    let bla = content.split('---')
    let yml = bla[1]
    let p = yaml.load(yml)
    let html = ``
    fS = {}
    editor = ''

    fs.readFile(configPath.toString(), (err, data) => {
        if (err) throw err
        let config = JSON.parse(data)
        fS = config.frontMatterSettings

        html += `<div class="middle postContents">
                    <h1><span>Edit Post</span></h1>
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
            for (let sets in fS){
            if (fS.hasOwnProperty(sets)) {
                    if (fS[sets].area == 'main') {
                        // console.log(`${sets} belongs in main area`)
                        html += functions.generateMeta('post', fS, sets, p[sets])
                    }
                }
            }
        }

        html += `       <div class="wrap">
                            <label for="edit-content" class="up">Content</label>
                            <div id="editPostContent"></div>
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
                        html += functions.generateMeta('post', fS, sets, p[sets])
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
            <button class="btn" id="save-post-edit">Save Post</button>
            <button class="btn" id="save-post-draft-edit">Save Draft</button>
            <button class="btn" id="delete-post-edit">Delete Post</button>
            <button class="btn" id="cancel-post-edit">Cancel</button>
        </div>`
        pageContent.innerHTML = ''
        pageContent.innerHTML = html
        editor = new Editor({
            el: document.querySelector('#editPostContent'),
            initialValue: bla[2],
            initialEditType: 'wysiwyg',
            previewStyle: 'tab',
            height: '900px'
        });
        functions.inputStyle()
    })

    pageContent.addEventListener('click', function (e) {
        if (e.target && e.target.id == 'cancel-post-edit') {
            let el = e.target
            if(confirm('Are you sure you want to cancel? All changes will be lost?')){
                store.delete('currentPostEditPath')
                generatePostsList();
            }
        }
        if (e.target && e.target.id == 'save-post-draft-edit') {
            let el = e.target
            savePostDraft(currentPath, editor)
        }
        if (e.target && e.target.id == 'save-post-edit') {
            let el = e.target
            savePost(currentPath, editor)
        }

        if (e.target && e.target.id == 'delete-post-edit') {
            let el = e.target
            alert('delete')
            if (confirm(`Are you sure you want to delete ${currentPath}?`)) {
                fs.unlink(currentPath.toString(), (err) => {
                    if (err) throw err;
                    generatePostsList()
                    alert(`${currentPath} was deleted`)
                    store.delete('currentPostEditPath')
                });
            }
        }

        // if (e.target && e.target.id == 'add-media') {
        //     let el = e.target
        //     functions.loadMediaGallery(mediaLibraryPath, popupContent, mediaFolder, editor)
        // }


    })
}
// for posts and pages
pageContent.addEventListener('click', function (e) {
    if (e.target && e.target.classList.contains('media-chooser')) {
        functions.loadMediaGallery(mediaLibraryPath, popupContent, mediaFolder, e.target)
    }
})

function postCreator(){
    let html = ''
    fS = {},
    editor = ''
    fs.readFile(configPath.toString(), (err, data) => {
        if (err) throw err
        let config = JSON.parse(data)
        fS = config.frontMatterSettings
        
        html += `<div class="middle postContents">
                    <h1><span>Create Post</span></h1>
                    <div class="cards-alt">
                        <div class="main">
                            <div class="card">
                                <div class="card-content">`
        if(!fS){
            html += `<div class="wrap">
                        <label for="title">Title</label>
                        <input type="text" name="title" id="title">
                    </div>`
        } else {
            for (let sets in fS) {
                if (fS.hasOwnProperty(sets)) {
                    if (fS[sets].area == 'main') {
                        // console.log(`${sets} belongs in main area`)
                        html += functions.generateMeta('post', fS, sets)
                    }
                }
            }
        }

        html += `       <div class="wrap">
                            <label for="edit-content" class="up">Content</label>
                            <div id="createPostContent"></div>
                        </div>
                    </div>
                </div>
            </div>`

        html += `<div class="secondary">
                    <div class="card">
                        <div class="card-content">`
        if (!fS) {
            html += `<p><i class="fas fa-exclamation-circle"></i> It seems like you don't have any Front Matter Configuration set up. You're Data Editing Experience can be better. <a href="#">learn more on how to configure.</a></p>`
            html += `<div class="wrap">
                        <label for="date">Date</label>
                        <input type="date" name="date" id="date">
                    </div>`
        } else {
            for (let sets in fS) {
                if (fS.hasOwnProperty(sets)) {
                    if (fS[sets].area != 'main') {
                        html += functions.generateMeta('post', fS, sets)
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
            <button class="btn" id="save-post-new">Save Post</button>
            <button class="btn" id="save-post-draft-new">Save Draft</button>
            <button class="btn" id="cancel-post-new">Cancel</button>
        </div>`
        pageContent.innerHTML = ''
        pageContent.innerHTML = html
        editor = new Editor({
            el: document.querySelector('#createPostContent'),
            initialEditType: 'wysiwyg',
            previewStyle: 'tab',
            height: '900px'
        });
        functions.inputStyle()
    })

    pageContent.addEventListener('click', function (e) {
        if (e.target && e.target.id == 'cancel-post-new') {
            let el = e.target
            if (confirm('Are you sure you want to cancel? All changes will be lost?')) {
                generatePostsList();
            }
        }
        if (e.target && e.target.id == 'save-post-draft-new') {
            let el = e.target
            savePostDraft(false, editor)
        }
        if (e.target && e.target.id == 'save-post-new') {
            let el = e.target
            savePost(false, editor)
        }
    })
}

function createFileContent(draft, editor){
    let newPostPath
    let config = {}
    let title = document.querySelector('#title').value
    let date = document.querySelector('#date').value
    let d = date.substr(0, 10)

    if(draft){
        newPostPath = path.join(draftsPath, `${functions.slugify(title)}.md`)
    } else {
        newPostPath = path.join(postsPath, `${d}-${functions.slugify(title)}.md`)
    }

    if(!fS) {
        datas = document.querySelectorAll('.postContents .wrap > input')
        datas.forEach(function (item) {
            let key = item.id
            let val = item.value
            config[key] = val
        })
    } else {
        for (let sets in fS) {
            if (fS.hasOwnProperty(sets)) {
                functions.retrieveMeta('post', fS, sets, config)
            }
        }
    }

    output = `---\n`
    output += yaml.safeDump(config)
    output += `---\n`
    output += editor.getMarkdown()

    // console.log(output)

    fs.writeFile(newPostPath, output, 'utf8', function (err) {
        if (err) return console.log(err);
    });
}

function savePost(filePath, editor) {
    // delete old file
    if(filePath != false){
        functions.deleteFile(filePath.toString())
        store.delete('currentPostEditPath')
    }    
    createFileContent(false, editor)
    alert('Post Saved')
}

function savePostDraft(filePath, editor) {
    // delete old file
    if (filePath != false) {
        functions.deleteFile(filePath.toString())
        store.delete('currentPostEditPath')
    }
    createFileContent(true, editor)
    alert('Draft Saved')
}