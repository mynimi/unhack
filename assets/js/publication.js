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

function openPublicationSettings(){
    // Save Button Click
    popupContent.addEventListener('click', function (e) {
        if (e.target && e.target.classList.contains('tab-toggle')){
            functions.inputStyle()
        }
        if (e.target && e.target.id == 'save-publication-settings') {
            let method = document.querySelector('input[name="publish-platform"]:checked').value
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
            gitHubS.gitHubUserEmail = document.querySelector('input[name="github-useremail"]').value

            // let gitHubPW = document.querySelector('input[name="github-password"]')
            // if (gitHubPW.value != '') {
            //     store.set('gitHubPassword', gitHubPW.value)
            // }
            gitHubS.gitHubRepoName = document.querySelector('input[name="github-repository-name"]').value

            functions.addToConfig(addConfig)
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
                if(config.publicationSettings){
                    const pS = config.publicationSettings
                    const ftpS = pS.ftp
                    const gitHubS = pS.gitHub

                    document.querySelector(`input[value="${pS.method}"]`).checked = true

                    document.querySelector('input[name="ftp-host"]').value = ftpS.ftpHost
                    document.querySelector('input[name="ftp-username"]').value = ftpS.ftpUsername
                    document.querySelector('input[name="ftp-port"]').value = ftpS.ftpPort
                    document.querySelector('input[name="ftp-directory"]').value = ftpS.ftpDirectory

                    document.querySelector('input[name="github-username"]').value = gitHubS.gitHubUsername
                    document.querySelector('input[name="github-useremail"]').value = gitHubS.gitHubUserEmail
                    document.querySelector('input[name="github-repository-name"]').value = gitHubS.gitHubRepoName
                }
                // console.log(pS)

                functions.inputStyle()
            })
        }
    })
    functions.openPopup()
}

