const fs = require('fs')
const prefs = require('./prefs')
const functions = require("./functions.js")
let store = prefs.store
const child_process = require('child_process');
const path = require('path')
const FtpDeploy = require('ftp-deploy');

const {
    ipcRenderer
} = require('electron');

const pageContent = document.querySelector('.container')
const popupContent = document.querySelector('.popup .content-loader')
let currentProjectPath = ''
if(store.has('currentProjectPath')) {
    currentProjectPath = store.get('currentProjectPath').toString()
}


pageContent.addEventListener('click', function(e){
    let pubMethod = store.get('publicationSettings.method')
    if(e.target && e.target.id == 'upload-site'){
        if (pubMethod == undefined) {
            ipcRenderer.send('show-message-box', 'error', 'No Method Selected', 'No Publication Method Selected, please Edit Publication Settings first!')
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
                // console.log('stdout: ' + data);
                htmlOutput.insertAdjacentHTML('beforeend', 'stdout: ' + data); //Here is where the output goes
            });
            child.stderr.on('data', function (data) {
                // console.log('stderr: ' + data);
                htmlOutput.insertAdjacentHTML('beforeend', 'stderr: ' + data); //Here is where the error output goes
            });
            child.on('close', function (code) {
                // console.log('closing code: ' + code);
                htmlOutput.insertAdjacentHTML('beforeend', 'closing code: ' + code); //Here you can get the exit code of the script
            });

            child.on('exit', function () {
                popupContent.insertAdjacentHTML('beforeend', '<button class="btn" id="upload-generated-site">Upload Site</button>')
            })
            const configPath = store.get('configFilePath')
            if (configPath) {
                fs.readFile(configPath.toString(), (err, data) => {
                    if (err) throw err
                    let config = JSON.parse(data)
                    const pS = config.publicationSettings
                    const ftpS = pS.ftp
                    const gitHubS = pS.gitHub
                    ftpS.ftpHost
                    ftpS.ftpUsername
                    ftpS.ftpPort
                    ftpS.ftpDirectory

                    gitHubS.gitHubUsername
                    gitHubS.gitHubProjectUrl

                    popupContent.addEventListener('click', function (e) {
                        if (e.target && e.target.id == 'upload-generated-site') {
                            if (pubMethod == 'ftp') {
                                if (ftpS.ftpPort == '') {
                                    ftpS.ftpPort = 21
                                }
                                let ftpDeploy = new FtpDeploy();

                                let config = {
                                    user: ftpS.ftpUsername, // NOTE that this was username in 1.x 
                                    password: store.get('ftpPassword'), // optional, prompted if none given
                                    host: ftpS.ftpHost,
                                    port: ftpS.ftpPort,
                                    localRoot: path.join(currentProjectPath.toString(), '_site'),
                                    remoteRoot: ftpS.ftpDirectory,
                                    // include: ['*', '**/*'],      // this would upload everything except dot files
                                    include: ['*', '**/*'],
                                    exclude: [],
                                    deleteRemote: true // delete existing files at destination before uploading
                                }
                                    
                                // use with callback
                                ftpDeploy.deploy(config, function (err) {
                                    htmlOutput.innerHTML = ''
                                    if (err) {
                                        htmlOutput.insertAdjacentHTML('beforeend', err)
                                        console.log(err)
                                    } else {
                                        htmlOutput.insertAdjacentHTML('beforeend', 'Files Uploaded')
                                    }
                                })

                                ftpDeploy.on('uploading', function (data) {
                                    htmlOutput.innerHTML = ''
                                    htmlOutput.insertAdjacentHTML('beforeend', data);
                                    htmlOutput.insertAdjacentHTML('beforeend', `totalFilesCount: ${data.totalFilesCount}`);
                                    htmlOutput.insertAdjacentHTML('beforeend', `transferredFileCount: ${data.transferredFileCount}`);
                                    htmlOutput.insertAdjacentHTML('beforeend', `filename: ${data.filename}`);
                                })
                                console.log(`password is ${store.get('ftpPassword')}`)
                            }
                            else if(pubMethod == 'github') {
                                let sourceBranch = 'source'
                                let siteBranch = 'gh-pages'

                                // let remoteURL = `https://github.com/${gitHubS.gitHubUsername}/${gitHubS.gitHubRepoName}.git`
                                let remoteURL = `git@github.com:${gitHubS.gitHubUsername}/${gitHubS.gitHubRepoName}.git`

                                if (gitHubS.gitHubRepoName.includes('.github.io')) {
                                    siteBranch == 'master'
                                }

                                if(fs.existsSync(path.join(currentProjectPath.toString(), '.git/'))){
                                    alert('is a Git directory')
                                    const child = child_process.spawn(`git add -A && git commit -m "create source branch" && git pull && git push origin ${sourceBranch} && git branch -D ${siteBranch} && git checkout -b ${siteBranch} && sed '1d' -i .gitignore && git add -A && git commit -m "add _site" && git filter-branch --subdirectory-filter _site/ -f && git push -f origin ${siteBranch} && git checkout ${sourceBranch}`, {
                                        shell: 'cmd',
                                        cwd: currentProjectPath
                                    })

                                    child.stdout.pipe(process.stdout);
                                    child.stderr.pipe(process.stderr);
                                    child.stdin.end();

                                    child.stdout.on('data', function (data) {
                                        // console.log('stdout: ' + data);
                                        htmlOutput.insertAdjacentHTML('beforeend', 'stdout: ' + data); //Here is where the output goes
                                    });
                                    child.stderr.on('data', function (data) {
                                        // console.log('stderr: ' + data);
                                        htmlOutput.insertAdjacentHTML('beforeend', 'stderr: ' + data); //Here is where the error output goes
                                    });
                                    child.on('close', function (code) {
                                        // console.log('closing code: ' + code);
                                        htmlOutput.insertAdjacentHTML('beforeend', 'closing code: ' + code); //Here you can get the exit code of the script
                                    });
                                } else{
                                    alert('is not a git directory')
                                    const child = child_process.spawn(`git init && git config user.email "${gitHubS.gitHubUserEmail}" && git config user.name "${gitHubS.gitHubUsername}" && git checkout -b ${sourceBranch} && git remote add origin ${remoteURL} && git add -A && git commit -m "create source branch" && git push origin ${sourceBranch} && git checkout -b ${siteBranch} && sed '1d' -i .gitignore && git add -A && git commit -m "add _site" && git filter-branch --subdirectory-filter _site/ -f && git push -f origin ${siteBranch} && git checkout ${sourceBranch}`, {
                                        shell: 'cmd',
                                        cwd: currentProjectPath
                                    })

                                    child.stdout.pipe(process.stdout);
                                    child.stderr.pipe(process.stderr);
                                    child.stdin.end();

                                    child.stdout.on('data', function (data) {
                                        // console.log('stdout: ' + data);
                                        htmlOutput.insertAdjacentHTML('beforeend', 'stdout: ' + data); //Here is where the output goes
                                    });
                                    child.stderr.on('data', function (data) {
                                        // console.log('stderr: ' + data);
                                        htmlOutput.insertAdjacentHTML('beforeend', 'stderr: ' + data); //Here is where the error output goes
                                    });
                                    child.on('close', function (code) {
                                        // console.log('closing code: ' + code);
                                        htmlOutput.insertAdjacentHTML('beforeend', 'closing code: ' + code); //Here you can get the exit code of the script
                                    });
                                }
                            }
                        }
                    })
                })
            }

        }
    }
})