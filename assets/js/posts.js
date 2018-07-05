const fs = require('fs')
const path = require('path')
const shell = require('shelljs')
const child_process = require('child_process')
const prefs = require('./prefs')
const functions = require("./functions.js")
const yaml = require('js-yaml');

const Editor = require('../../node_modules/tui-editor')

let store = prefs.store

const {
    ipcRenderer,
    remote
} = require('electron');

let pageContent = document.querySelector('.container')
const postsPath = path.join(store.get('currentProjectPath'), '_posts')
const draftsPath = path.join(store.get('currentProjectPath'), '_drafts')

document.querySelector('.nav-posts').addEventListener('click', function (e) {
    let others = document.querySelector('.sidenav span.active')
    let el = e.target
    others.classList.remove("active")
    el.classList.add("active")
    generatePostsList()
})

function generatePostsList(){
    let postPathList = functions.getPathsInDir(postsPath.toString())
    let draftPathList = functions.getPathsInDir(draftsPath.toString())
    let allPosts = [...postPathList, ...draftPathList]

    let output = `<div class="middle">
                    <h1>Posts</h1>
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
                                            <th>Categories</th>
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
        console.log(data)
        let d = new Date(data.date)
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        let status;
        if(p.includes('_drafts')){
            status = 'Draft'
        } else{
            status = 'Published'
        }
        output +=   `<tr>
                        <td>${path.basename(p.toString())}</td>
                        <td>${data.title}</td>
                        <td>${months[d.getMonth()]} ${d.getDay()}, ${d.getFullYear()}</td>
                        <td>${data.categories}</td>
                        <td>${status}</td>
                        <td>
                            <button class="btn edit-post" data-postPath="${p}">Edit</button>
                            <button class="btn duplicate-post" data-postPath="${p}">Duplicate</button>
                            <button class="btn delete-post" data-postPath="${p}">Delete</button>
                        </td>
                    </tr>`
    })
    output += `</tbody></table></div></div></div></div>`

    pageContent.innerHTML = output
    // functions.inputStyle()

}

pageContent.addEventListener('click', function (e) {
    console.log(e.target.classList)
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
        postcreator()
    }
})

function postEditor(filePath){
    let content = fs.readFileSync(filePath.toString(), 'utf8')
    let bla = content.split('---')
    let yml = bla[1]
    let p = yaml.load(yml)
  
    html = 
    `<div class="middle postContents">
        <h1>Edit Post</h1>
        <div class="cards-alt">
            <div class="main">
                <div class="card">
                    <div class="card-content">
                        <div class="wrap">
                            <label for="title">Title</label>
                            <input type="text" value="${(p != undefined) ? p.title : ''}" id="title" name="title">
                        </div>
                        <div class="wrap">
                            <label for="edit-content" class="up">Content</label>
                            <div id="editSection"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="secondary">
                <div class="card">
                    <div class="card-content">`
        for (var key in p) {
            if(key != 'title'){
                if (p.hasOwnProperty(key)) {
                    html += `<div class="wrap">` +
                        `<label for="${key}">${key}</label>` +
                        `<input type="text" name="${key}" id="${key}" value="${p[key]}">` +
                        `</div>`
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
        <button class="btn" id="save-post-edit">Save Post</button>
        <button class="btn" id="save-post-draft-edit">Save Draft</button>
        <button class="btn" id="delete-post-edit">Delete Post</button>
        <button class="btn" id="cancel-post-edit">Cancel</button>
    </div>`
    pageContent.innerHTML = html
    let editor = new Editor({
        el: document.querySelector('#editSection'),
        initialValue: bla[2],
        initialEditType: 'wysiwyg',
        previewStyle: 'tab',
        height: '500px'
    });
    functions.inputStyle()

    pageContent.addEventListener('click', function (e) {
        if (e.target && e.target.id == 'cancel-post-edit') {
            let el = e.target
            if(confirm('Are you sure you want to cancel? All changes will be lost?')){
                generatePostsList();
            }
        }
        if (e.target && e.target.id == 'save-post-draft-edit') {
            let el = e.target
            savePostDraft(filePath, editor)
        }
        if (e.target && e.target.id == 'save-post-edit') {
            let el = e.target
            savePost(filePath, editor)
        }

        if (e.target && e.target.id == 'delete-post-edit') {
            let el = e.target
            alert('delete')
            if (confirm(`Are you sure you want to delete ${filePath}?`)) {
                fs.unlink(filePath, (err) => {
                    if (err) throw err;
                    generatePostsList()
                    alert(`${filePath} was deleted`)
                });
            }
        }

    })
}
function postCreator(filePath){
    let content = fs.readFileSync(filePath.toString(), 'utf8')
    let bla = content.split('---')
    let yml = bla[1]
    let p = yaml.load(yml)
  
    html = 
    `<div class="middle postContents">
        <h1>Edit Post</h1>
        <div class="cards-alt">
            <div class="main">
                <div class="card">
                    <div class="card-content">
                        <div class="wrap">
                            <label for="title">Title</label>
                            <input type="text" value="${(p != undefined) ? p.title : ''}" id="title" name="title">
                        </div>
                        <div class="wrap">
                            <label for="edit-content" class="up">Content</label>
                            <div id="editSection"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="secondary">
                <div class="card">
                    <div class="card-content">`
        for (var key in p) {
            if(key != 'title'){
                if (p.hasOwnProperty(key)) {
                    html += `<div class="wrap">` +
                        `<label for="${key}">${key}</label>` +
                        `<input type="text" name="${key}" id="${key}" value="${p[key]}">` +
                        `</div>`
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
        <button class="btn" id="save-post-edit">Save Post</button>
        <button class="btn" id="save-post-draft-edit">Save Draft</button>
        <button class="btn" id="delete-post-edit">Delete Post</button>
        <button class="btn" id="cancel-post-edit">Cancel</button>
    </div>`
    pageContent.innerHTML = html
    let editor = new Editor({
        el: document.querySelector('#editSection'),
        initialValue: bla[2],
        initialEditType: 'wysiwyg',
        previewStyle: 'tab',
        height: '500px'
    });
    functions.inputStyle()

    pageContent.addEventListener('click', function (e) {
        if (e.target && e.target.id == 'cancel-post-edit') {
            let el = e.target
            if(confirm('Are you sure you want to cancel? All changes will be lost?')){
                generatePostsList();
            }
        }
        if (e.target && e.target.id == 'save-post-draft-edit') {
            let el = e.target
            savePostDraft(filePath, editor)
        }
        if (e.target && e.target.id == 'save-post-edit') {
            let el = e.target
            savePost(filePath, editor)
        }

        if (e.target && e.target.id == 'delete-post-edit') {
            let el = e.target
            alert('delete')
            if (confirm(`Are you sure you want to delete ${filePath}?`)) {
                fs.unlink(filePath, (err) => {
                    if (err) throw err;
                    generatePostsList()
                    alert(`${filePath} was deleted`)
                });
            }
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

    datas = document.querySelectorAll('.postContents .wrap > input')
    datas.forEach(function (item) {
        let key = item.id
        let val = item.value
        config[key] = val
    })

    output = `---\n`
    output += yaml.safeDump(config)
    output += `---\n`
    output += editor.getValue()

    console.log(output)

    fs.writeFile(newPostPath, output, 'utf8', function (err) {
        if (err) return console.log(err);
    });
}

function savePost(filePath, editor) {
    // delete old file
    if(filePath){
        functions.deleteFile(filePath)
    }    
    createFileContent(false, editor)
}

function savePostDraft(filePath, editor) {
    // delete old file
    if (filePath) {
        functions.deleteFile(filePath)
    }
    createFileContent(true, editor)
}

