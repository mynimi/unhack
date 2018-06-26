const fs = require('fs');
const path = require('path');
const shell = require('shelljs')
const child_process = require('child_process');
const prefs = require('./prefs')
let store = prefs.store

const {
    ipcRenderer,
    remote
} = require('electron');

const pageContent = document.querySelector('.container')
const popupContent = document.querySelector('.popup .content-loader') 
const functions = require("./functions.js");

const createProjectPath = functions.htmlPath('createProject')

ipcRenderer.on('create-project', function(){
    alert('Create New Project Loading!');
    fs.readFile(createProjectPath, (err, data) => {
        popupContent.innerHTML = data
        functions.inputStyle()
    })
    functions.openPopup()
});

if(!store.get('currentProjectPath')){
    fs.readFile(createProjectPath, (err, data) => {
        pageContent.innerHTML = data
        functions.inputStyle()
    })
} else {
    const dashboard = functions.htmlPath('dashboard')

    fs.readFile(dashboard, (err, data) => {
        pageContent.innerHTML = data
    })
}

// Variables
let projectParentPath;

// Event Delegation because Elements are dynamic
pageContent.addEventListener('click', function (e) {
    if (e.target && e.target.id == 'select-directory') {
        ipcRenderer.send('open-directory-dialog')
    }
})

ipcRenderer.on('selectedItem', function (event, path) {
    let htmlOutput = document.querySelector('#output')

    document.getElementById('selectedItem').value = `You selected: ${path}`
    projectParentPath = path.toString();

    htmlOutput.innerHTML = "" // clear previous Output

    const child = child_process.spawn('pwd && ls && jekyll -v', {
        shell: 'cmd',
        cwd: projectParentPath
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
})

pageContent.addEventListener('click', function (e) {
    if (e.target && e.target.id == 'create-site') {
        const siteName = document.getElementById('project-name').value
        let htmlOutput = document.querySelector('#output')

        htmlOutput.innerHTML = "" // clear previous Output

        const child = child_process.spawn(`jekyll new ${siteName}`, {
            shell: 'cmd',
            cwd: projectParentPath
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
            // write PAth to config
            const projectPath = path.join(projectParentPath, siteName)

            store.set('currentProjectPath', projectPath);

            // Create a Config File
            const unhackConfig = {
                name: siteName,
            }
            const fileName = 'unhack.config';
            const configPath = path.join(projectPath, fileName)
            fs.writeFile(configPath, JSON.stringify(unhackConfig, null, 2), (err) => {
                if (err) throw err;
            });

            const siteCreated = functions.htmlPath('dashboard')

            fs.readFile(siteCreated, (err, data) => {
                pageContent.innerHTML = data
                document.querySelector('.alert-info').innerHTML = 'Site successfully created'
                if (err) {
                    console.log(err);
                }
            })
        })
    }
})
