const fs = require('fs')
const path = require('path')
const prefs = require('./prefs')
const functions = require("./functions.js")
let store = prefs.store
const Editor = require('../../node_modules/tui-editor')

const {
    ipcRenderer,
    remote
} = require('electron');

let popupContent = document.querySelector('.popup .content-loader')
let pageContent = document.querySelector('.container')
const mediaFolder = path.join(store.get('currentProjectPath'), 'assets')

let mediaFiles = {}

const mediaLibraryPath = functions.htmlPath('medialib')

document.querySelector('body').insertAdjacentHTML('beforeend', '<button id="clicker" class="btn">clicker!</button>');

document.querySelector('body').addEventListener('click', function(e){
    if(e.target && e.target.id == 'clicker'){
        alert(`clicker clicked!`)
        alert(document.getElementById('editSection') instanceof Editor)
    }
})

// let markdownFormat = `![${alttext}]({{ "/assets/${filename}" | absolute_url }})`

// console.log(mediaLibraryPath)
// pageContent.addEventListener('click', function (e) {
//     if (e.target && e.target.id == 'add-media') {
//         let el = e.target
//         loadMediaGallery()
//     }
// })

// function loadMediaGallery(editor){
//     fs.readFile(mediaLibraryPath, (err, data) => {
//         popupContent.innerHTML = data
//         functions.inputStyle()
//         fillGallery()

//         document.ondragover = document.ondrop = (ev) => {
//             ev.preventDefault()
//         }
//         const dropArea = document.querySelector('.droppable')
//         dropArea.ondrop = (ev) => {
//             imageToAdd = ev.dataTransfer.files[0].path

//             ev.preventDefault()
            
//             dropArea.classList.remove('dragging')

//             if (imageToAdd.toString().includes(mediaFolder.toString())) {
//                 alert('File is already in Assets Folder')
//             } else {
//                 let newImagePath = path.join(mediaFolder,path.basename(imageToAdd))
//                 functions.copyFile(imageToAdd, newImagePath, function () {
//                     fillGallery()
//                     alert('File Added')
//                 })
//             }

//         }
//         dropArea.ondragenter = (ev) => {
//             dropArea.classList.add('dragging')
//         }
//         dropArea.ondragleave = (ev) => {
//             dropArea.classList.remove('dragging')
//         }
//     })
//     functions.openPopup()
// }

// function fillGallery(){
//     let images = functions.getPathsInDir(mediaFolder.toString())
//     let lib = ``
//     for (img in images) {
//         lib += `<img src="${images[img]}" alt="${path.basename(images[img])}">`
//     }
//     document.querySelector('.media-gallery').innerHTML = lib
// }