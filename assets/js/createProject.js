const fs = require('fs');
const path = require('path');
const upath = require('upath');
const shell = require('shelljs')
const child_process = require('child_process');
const {
    ipcRenderer,
    remote
} = require('electron');

const pageContent = document.querySelector('.container')

const functions = require("./functions.js");

const createProjectPath = functions.htmlPath('createProject')

fs.readFile(createProjectPath, (err, data) => {
    pageContent.innerHTML = data
    functions.inputStyle()
})

// Variables
let projectPath;

// Event Delegation because Elemtns are dynamic
pageContent.addEventListener('click', function (e) {
    if (e.target && e.target.id == 'select-directory') {
        ipcRenderer.send('open-directory-dialog')
    }
})

ipcRenderer.on('selectedItem', function (event, path) {
    let htmlOutput = document.querySelector('#output')

    document.getElementById('selectedItem').value = `You selected: ${path}`
    projectPath = path.toString();

    // unixPath = `/mnt/${upath.normalize(path.toString()).replace('C:', 'c')}`
    // console.log(`unixpath ${unixPath}`)

    htmlOutput.innerHTML = "" // clear previous Output

    // TODO: figure out Mac/Linux Version
    const child = child_process.spawn('pwd && ls && jekyll -v', {
        shell: 'cmd',
        cwd: projectPath
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

        // TODO: figure out Mac/Linux Version
        const child = child_process.spawn(`jekyll new ${siteName}`, {
            shell: 'cmd',
            cwd: projectPath
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
            const unhackConfig = {
                name: siteName,
                path: projectPath
            }
            const fileName = 'unhack.config';
            const configPath = path.join(projectPath, siteName, fileName)

            console.log(configPath)

            fs.writeFile(configPath, JSON.stringify(unhackConfig, null, 2), (err) => {
                if (err) throw err;
                console.log('The file has been saved!');

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
