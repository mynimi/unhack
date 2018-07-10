const fs = require('fs')
const prefs = require('./prefs')
const functions = require("./functions.js")
let store = prefs.store
const child_process = require('child_process');

const {
    ipcRenderer
} = require('electron');

const pageContent = document.querySelector('.container')
const popupContent = document.querySelector('.popup .content-loader')
const currentProjectPath = store.get('currentProjectPath')


let pubMethod = store.get('publicationSettings.method')

pageContent.addEventListener('click', function(e){
    if(e.target && e.target.id == 'upload-site'){
        if (pubMethod == undefined) {
            alert('No Publication Method Selected, please Edit Publication Settings first!')
        } else {
            popupContent.innerHTML =    `<h1><span>Publish Site</span></h1>
                                        <p>Publishing via ${pubMethod}</p>
                                        <div class="wrap"><label for="generation-output" class="up">Generating jekyll site</label><textarea name="generation-output" id="generation-output" placeholder="output" style="min-height: 200px"></textarea></div>`
            functions.openPopup()
            if(pubMethod == 'ftp'){
                console.log(`password is ${store.get('ftpPassword')}`)
            }
            if(pubMethod == 'gitHub'){
                console.log(`password is ${store.get('gitHubPassword')}`)
            }

            htmlOutput = document.getElementById('generation-output')
            const child = child_process.spawn('jekyll build', {
                shell: 'cmd',
                cwd: currentProjectPath
            })
            
            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);
            child.stdin.end();

            child.stdout.on('data', function (data) {
                console.log('stdout: ' + data);
                htmlOutput.insertAdjacentHTML('beforeend', 'stdout: ' + data); //Here is where the output goes
            });
            child.stderr.on('data', function (data) {
                console.log('stderr: ' + data);
                htmlOutput.insertAdjacentHTML('beforeend', 'stderr: ' + data); //Here is where the error output goes
            });
            child.on('close', function (code) {
                console.log('closing code: ' + code);
                htmlOutput.insertAdjacentHTML('beforeend', 'closing code: ' + code); //Here you can get the exit code of the script
            });

            child.on('exit', function () {
                popupContent.insertAdjacentHTML('beforeend', '<button class="btn" id="upload-generated-site">Upload Site</button>')
            })
        }
    }
})