const fs = require('fs')
const path = require('path')
const prefs = require('./prefs')
const functions = require("./functions.js")
let store = prefs.store

const {
    ipcRenderer,
    remote
} = require('electron');

const pageContent = document.querySelector('.container')
const popupContent = document.querySelector('.popup .content-loader')

const publicationSettingsPath = functions.htmlPath('publicationSettings')

pageContent.addEventListener('click', function (e) {
    if (e.target && e.target.id == 'publication-settings') {
        fs.readFile(publicationSettingsPath, (err, data) => {
            popupContent.innerHTML = data
            functions.inputStyle()
            const pubSettings = document.querySelector('.publication-settings')
            if (store.get('publicationSettings.method')) {
                document.querySelector(`input[value="${store.get('publicationSettings.method')}"]`).checked = true
                console.log(store.get('publicationSettings.method'))
            }
        })
        functions.openPopup()
    }
})


popupContent.addEventListener('click', function (e) {
    if (e.target && e.target.id == 'save-publication-settings') {
        const method = document.querySelector('input[name="publish-platform"]:checked').value
        store.set('publicationSettings.method', method)
        functions.closePopup();
    }
})
