const fs = require('fs')
const prefs = require('./prefs')
const functions = require("./functions.js")
let store = prefs.store

const {
    ipcRenderer
} = require('electron');

const pageContent = document.querySelector('.container')
const popupContent = document.querySelector('.popup .content-loader')

const publicationSettingsPath = functions.htmlPath('publicationSettings')

let addConfig = {}


ipcRenderer.on('open-publication-settings', function () {
    openPublicationSettings()
})

pageContent.addEventListener('click', function (e) {
    if (e.target && e.target.id == 'publication-settings') {
        openPublicationSettings()
    }
})

// TODO: Generate Hashs for Passwords

function openPublicationSettings(){
    // Save Button Click
    popupContent.addEventListener('click', function (e) {
        if (e.target && e.target.id == 'save-publication-settings') {
            const method = document.querySelector('input[name="publish-platform"]:checked').value
            store.set('publicationSettings.method', method)
            addConfig.publicationSettings = {}
            const pS = addConfig.publicationSettings
            pS.ftp = {}
            pS.gitHub = {}
            const ftpS = pS.ftp
            const gitHubS = pS.gitHub
            pS.method = method

            ftpS.ftpHost = document.querySelector('input[name="ftp-host"]').value
            ftpS.ftpUsername = document.querySelector('input[name="ftp-username"]').value
            let ftpPW = document.querySelector('input[name="ftp-password"]')
            if(ftpPW.value != ''){
                store.set('ftpPassword', ftpPW.value)
            }
            ftpS.ftpPort = document.querySelector('input[name="ftp-port"]').value
            ftpS.ftpDirectory = document.querySelector('input[name="ftp-directory"]').value

            gitHubS.gitHubUsername = document.querySelector('input[name="github-username"]').value

            let gitHubPW = document.querySelector('input[name="github-password"]')
            if (gitHubPW.value != '') {
                store.set('gitHubPassword', gitHubPW.value)
            }
            gitHubS.gitHubProjectUrl = document.querySelector('input[name="github-project-url"]').value

            functions.addToConfig(addConfig)
            popupContent.innerHTML = ''
            functions.closePopup();
        }
    })
    
    fs.readFile(publicationSettingsPath, (err, data) => {
        popupContent.innerHTML = data

        const configPath = store.get('configFilePath')
        if (configPath) {
            fs.readFile(configPath.toString(), (err, data) => {
                if (err) throw err
                let config = JSON.parse(data)
                const pS = config.publicationSettings
                const ftpS = pS.ftp
                const gitHubS = pS.gitHub

                document.querySelector(`input[value="${pS.method}"]`).checked = true

                document.querySelector('input[name="ftp-host"]').value = ftpS.ftpHost
                document.querySelector('input[name="ftp-username"]').value = ftpS.ftpUsername
                document.querySelector('input[name="ftp-port"]').value = ftpS.ftpPort
                document.querySelector('input[name="ftp-directory"]').value = ftpS.ftpDirectory

                document.querySelector('input[name="github-username"]').value = gitHubS.gitHubUsername
                document.querySelector('input[name="github-project-url"]').value = gitHubS.gitHubProjectUrl

                // console.log(pS)

                functions.inputStyle()
            })
        }
    })
    functions.openPopup()
}

