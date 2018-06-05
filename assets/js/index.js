const fs = require('fs');
const path = require('path');
const upath = require('upath');
const shell = require('shelljs')
const child_process = require('child_process');

const {ipcRenderer} = require('electron');

// Variables
const selectDirBtn = document.getElementById('select-directory')
const projectName = document.getElementById('project-name')
const createSite = document.getElementById('create-site')
const htmlOutput = document.getElementById('output')

var projectPath;

selectDirBtn.addEventListener('click', function (event) {
    ipcRenderer.send('open-directory-dialog')
})

ipcRenderer.on('selectedItem', function (event, path) {
    document.getElementById('selectedItem').innerHTML = `You selected: ${path}`
    projectPath = path.toString();

    // unixPath = `/mnt/${upath.normalize(path.toString()).replace('C:', 'c')}`
    // console.log(`unixpath ${unixPath}`)

    htmlOutput.innerHTML = "" // clear previous Output

    // TODO: figure out Mac/Linux Version
    const child = child_process.spawn('pwd && ls && jekyll -v', { shell: 'cmd', cwd: projectPath })

    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    child.stdin.end();

    child.stdout.on('data', function (data) {
        console.log('stdout: ' + data);
        htmlOutput.insertAdjacentHTML('beforeend', 'stdout: ' + data);//Here is where the output goes
    });
    child.stderr.on('data', function (data) {
        console.log('stderr: ' + data);
        htmlOutput.insertAdjacentHTML('beforeend', 'stderr: ' + data);//Here is where the error output goes
    });
    child.on('close', function (code) {
        console.log('closing code: ' + code);
        htmlOutput.insertAdjacentHTML('beforeend', 'closing code: ' + code);//Here you can get the exit code of the script
    });

})


// shell.config.execPath = shell.which('/c/Program Files/nodejs/node')

createSite.addEventListener('click', function(event){
    const siteName = projectName.value
    alert(siteName)

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

})

