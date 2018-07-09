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

let pageContent = document.querySelector('.container')
let popupContent = document.querySelector('.popup .content-loader') 
const functions = require("./functions.js");

const createProjectPath = functions.htmlPath('createProject')
const openProjectPath = functions.htmlPath('openProject')

const dashboard = functions.htmlPath('dashboard')

ipcRenderer.on('create-project', function(){
    fs.readFile(createProjectPath, (err, data) => {
        popupContent.innerHTML = data
        functions.inputStyle()
    })
    functions.openPopup()
});

ipcRenderer.on('project-opened', function(){
    fs.readFile(dashboard, (err, data) => {
        pageContent.innerHTML = data
    })
})

if(!store.get('currentProjectPath')){
    fs.readFile(openProjectPath, (err, data) => {
        pageContent.innerHTML = data
        let projectToOpen

        document.ondragover = document.ondrop = (ev) => {
            ev.preventDefault()
        }
        const dropArea = document.querySelector('.droparea')
        dropArea.ondrop = (ev) => {
            projectToOpen = ev.dataTransfer.files[0].path
            ev.preventDefault()
            dropArea.classList.remove('dragging')

            if (projectToOpen) {
                const configPath = path.join(projectToOpen.toString(), 'unhack.json');

                // console.log(configPath)

                if (fs.existsSync(configPath)) {
                    store.set('currentProjectPath', projectToOpen)
                    store.set('configFilePath', configPath)

                    const config = fs.readFileSync(configPath)
                    const c = JSON.parse(config)

                    store.set('projectName', c.name.toString())
                    // console.log(c.name)
                    // console.log('new project path is ' + store.get('currentProjectPath'))
                    fs.readFile(dashboard, (err, data) => {
                        pageContent.innerHTML = data
                        if (err) {
                            console.log(err);
                        }
                    })
                    ipcRenderer.send('create-new-done')
                    document.querySelector('body').classList.add('has-sidenav')
                    document.querySelector('.sidenav').classList.remove('hidden')
                } else {
                    dialog.showErrorBox('Not an Unhack Project', 'The Directory you selected does not seem to be an Unhack Project.')
                }
                // console.log(projectToOpen)
            }
            
        }
        dropArea.ondragenter = (ev) => {
            dropArea.classList.add('dragging')
        }
        dropArea.ondragleave = (ev) => {
            dropArea.classList.remove('dragging')
        }

        pageContent.addEventListener('click', function (e) {
            if (e.target && e.target.id == 'start-create-new-project') {
                fs.readFile(createProjectPath, (err, data) => {
                    popupContent.innerHTML = data
                    functions.inputStyle()
                })
                functions.openPopup()
            }
        })
    })
} else {
    fs.readFile(dashboard, (err, data) => {
        pageContent.innerHTML = data
    })
}

// Variables
let projectParentPath;

// Event Delegation because Elements are dynamic
popupContent.addEventListener('click', function (e) {
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

popupContent.addEventListener('click', function (e) {
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
            store.set('projectName', siteName);

            // Create a Config File
            const unhackConfig = {
                name: siteName,
            }
            const fileName = 'unhack.json';
            const configPath = path.join(projectPath, fileName)

            store.set('configFilePath', configPath)

            fs.writeFile(configPath, JSON.stringify(unhackConfig, null, 2), (err) => {
                if (err) throw err;
            });

            const siteCreated = functions.htmlPath('dashboard')

            fs.readFile(siteCreated, (err, data) => {
                pageContent.innerHTML = data
                if (err) {
                    console.log(err);
                }
            })

            popupContent.innerHTML = ''
            functions.closePopup()

            ipcRenderer.send('create-new-done')
            document.querySelector('body').classList.add('has-sidenav')
            document.querySelector('.sidenav').classList.remove('hidden')
        })
    }
})
