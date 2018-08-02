const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const prefs = require('./prefs')
let store = prefs.store

const {
    ipcRenderer
} = require('electron');

let pageContent = document.querySelector('.container')
let popupContent = document.querySelector('.popup .content-loader')
const functions = require("./functions.js");
const dashboard = require("./dashboard.js")

const createProjectPath = functions.htmlPath('createProject')
const openProjectPath = functions.htmlPath('openProject')

if(store.get('isJekyllInstalled')){
    console.log('jekyll is installed is saved')
    ipcRenderer.send('ready-to-start')
} else{
    console.log('jekyll is installed is not set')
    child_process.exec('jekyll -v', (err, stdout, stderr) => {
        if (err) {
            console.error(`exec error: ${err}`);
            store.set('isJekyllInstalled', false)
            ipcRenderer.send('show-error-message', 'No Jekyll Found', "Looks like you don't have jekyll installed. unHack requires jekyll to be installed in order to function.")
            ipcRenderer.send('open-link', 'https://jekyllrb.com/docs/installation/')
            return;
        }
        console.log(`jekyll version is ${stdout}`);
        store.set('isJekyllInstalled', true)
        ipcRenderer.send('ready-to-start')
    });
}

ipcRenderer.on('create-project', function(){
    fs.readFile(createProjectPath, (err, data) => {
        popupContent.innerHTML = data
        functions.inputStyle()
    })
    functions.openPopup()
});

ipcRenderer.on('project-opened', function(){
    dashboard.open()
})

ipcRenderer.on('show-open-and-create', function(){
    console.log('we are ready to start')

    if (store.has('currentProjectPath')) {
        console.log('we have a path')
        if (fs.existsSync(store.get('currentProjectPath').toString())) {
            console.log('path still exists.')
            dashboard.open()
        } else{
            console.log('path no longer exists, so we start over.')
            showDropArea()
        }
    } else{
        showDropArea()
    }

    function showDropArea() {
        fs.readFile(openProjectPath, (err, data) => {
            store.clear()
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

                    if (fs.existsSync(configPath)) {
                        store.set('currentProjectPath', projectToOpen)
                        store.set('configFilePath', configPath)

                        const config = fs.readFileSync(configPath)
                        const c = JSON.parse(config)

                        store.set('projectName', c.name.toString())
                        dashboard.open()
                        ipcRenderer.send('create-new-done')
                        document.querySelector('body').classList.add('has-sidenav')
                        document.querySelector('.sidenav').classList.remove('hidden')
                    } else {
                        dialog.showErrorBox('Not an Unhack Project', 'The Directory you selected does not seem to be an Unhack Project.')
                    }
                }

            }
            dropArea.ondragenter = (ev) => {
                dropArea.classList.add('dragging')
            }
            dropArea.ondragleave = (ev) => {
                dropArea.classList.remove('dragging')
            }            
        })
    }
})

pageContent.addEventListener('click', function (e) {
    if (e.target && e.target.id == 'start-create-new-project') {
        fs.readFile(createProjectPath, (err, data) => {
            popupContent.innerHTML = data
            functions.inputStyle()
        })
        functions.openPopup()
    }
})

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

})

popupContent.addEventListener('click', function (e) {
    if (e.target && e.target.id == 'clone-unhacked') {
        store.clear()
        const parentDirectory = document.getElementById('selectedItem').value
        const siteName = document.getElementById('project-name').value

        if (parentDirectory == '' || siteName == '') {
            ipcRenderer.send('show-error-message', 'Error', "Please fill out all fields before hitting create.")
        } else {
            let htmlOutput = document.querySelector('#output')

            htmlOutput.innerHTML = "" // clear previous Output
            let child;

            if (process.platform !== 'darwin') {
                child = child_process.spawn(`git clone git@github.com:mynimi/unhacked-jekyll-theme.git && rename unhacked-jekyll-theme ${siteName} && cd ${siteName} && bundle install && rmdir .git /s /q`, {
                    shell: 'cmd',
                    cwd: projectParentPath
                })
            } else {
                child = child_process.spawn(`git clone git@github.com:mynimi/unhacked-jekyll-theme.git && mv unhacked-jekyll-theme ${siteName} && cd ${siteName} && bundle install && rm -rf .git`, {
                    shell: true,
                    cwd: projectParentPath
                })
            }

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

                const fileName = 'unhack.json';
                const configPath = path.join(projectPath, fileName)

                store.set('configFilePath', configPath)

                fs.readFile(configPath, (err, data) => {
                    if (err) throw err
                    let config = JSON.parse(data)
                    config.name = siteName
                    delete config.publicationSettings
                    
                    fs.writeFile(configPath, JSON.stringify(config, null, 2), (err) => {
                        if (err) throw err
                        // ipcRenderer.send('show-message-box', 'none', 'Settings Saved', "Settings were sucessfully saved to Config File.")
                    })
                })

                dashboard.open()

                popupContent.innerHTML = ''
                functions.closePopup()

                ipcRenderer.send('create-new-done')
                document.querySelector('body').classList.add('has-sidenav')
                document.querySelector('.sidenav').classList.remove('hidden')
            })

        }
    }
    if (e.target && e.target.id == 'create-site') {
        store.clear()
        const parentDirectory = document.getElementById('selectedItem').value
        const siteName = document.getElementById('project-name').value

        if(parentDirectory == '' || siteName == ''){
            ipcRenderer.send('show-error-message', 'Error', "Please fill out all fields before hitting create.")
        } else{
            let htmlOutput = document.querySelector('#output')

            htmlOutput.innerHTML = "" // clear previous Output
            let child;

            if (process.platform !== 'darwin') {
                child = child_process.spawn(`jekyll new ${siteName}`, {
                    shell: 'cmd',
                    cwd: projectParentPath
                })
            } else {
                child = child_process.spawn(`jekyll new ${siteName}`, {
                    shell: true,
                    cwd: projectParentPath
                })
            }

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

                dashboard.open()

                popupContent.innerHTML = ''
                functions.closePopup()

                ipcRenderer.send('create-new-done')
                document.querySelector('body').classList.add('has-sidenav')
                document.querySelector('.sidenav').classList.remove('hidden')
            })

        }
    }
})
