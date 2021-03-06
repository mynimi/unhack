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
let pubMethod = ''
let pS = ''
let ftpS = ''
let gitHubS = ''


if(store.has('currentProjectPath')) {
    currentProjectPath = store.get('currentProjectPath').toString()
}

ipcRenderer.on('open-upload', function () {
    runUpload()
})

pageContent.addEventListener('click', function(e){
    if (e.target && e.target.id == 'upload-site') {
        runUpload()
    }
})

function runUpload() {
    pubMethod = store.get('publicationSettings.method')

        if (pubMethod == undefined) {
            ipcRenderer.send('show-message-box', 'error', 'No Method Selected', 'No Publication Method Selected, please Edit Publication Settings first!')
        } else {
            popupContent.innerHTML = `<h1><span>Publish Site</span></h1>
                                        <p>Publishing via ${pubMethod}</p>
                                        <div class="wrap"><label for="generation-output" class="up">Generating jekyll site</label><textarea name="generation-output" id="generation-output" placeholder="output" style="min-height: 200px"></textarea></div>`
            functions.openPopup()
            if (pubMethod == 'ftp') {
                // console.log(`password is ${store.get('ftpPassword')}`)
            }
            if (pubMethod == 'gitHub') {
                // console.log(`password is ${store.get('gitHubPassword')}`)
            }

            htmlOutput = document.getElementById('generation-output')
            let child;
            if (process.platform !== 'darwin') {
                child = child_process.spawn('jekyll build', {
                    shell: 'cmd',
                    cwd: currentProjectPath
                })
            } else {
                child = child_process.spawn('jekyll build', {
                    shell: 'true',
                    cwd: currentProjectPath
                })
            }


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
                popupContent.insertAdjacentHTML('beforeend', `${(pubMethod == 'ftp') ? '<p><i class="fas fa-exclamation-triangle"></i> All Contents of given Directory will be removed and replaced with current generated site. This cannot be undone and affects your live site on the Internet.</p>' : ''}<button class="btn" id="upload-generated-site">Upload Site</button>`)
            })
            const configPath = store.get('configFilePath')
            if (configPath) {
                fs.readFile(configPath.toString(), (err, data) => {
                    if (err) throw err
                    let config = JSON.parse(data)
                    pS = config.publicationSettings
                    ftpS = pS.ftp
                    gitHubS = pS.gitHub
                    ftpS.ftpHost
                    ftpS.ftpUsername
                    ftpS.ftpPort
                    ftpS.ftpDirectory

                    gitHubS.gitHubUsername
                    gitHubS.gitHubProjectUrl

                })
            }

        }
}

popupContent.addEventListener('click', function (e) {
    if (e.target && e.target.id == 'upload-generated-site') {
        if (pubMethod == 'ftp') {
            let localRoot = path.join(currentProjectPath.toString(), '_site')

            let filesToUpload = functions.getPathsInDir(localRoot)

            function flatten(lists) {
                return lists.reduce((a, b) => a.concat(b), []);
            }

            function getDirectories(srcpath) {
                return fs.readdirSync(srcpath)
                    .map(file => path.join(srcpath, file))
                    .filter(path => fs.statSync(path).isDirectory());
            }

            function getDirectoriesRecursive(srcpath) {
                return [srcpath, ...flatten(getDirectories(srcpath).map(getDirectoriesRecursive))];
            }

            let subDirs = getDirectoriesRecursive(localRoot)

            // console.log(subDirs)
            // console.log(filesToUpload)

            htmlOutput.innerHTML = ''

            if (ftpS.ftpPort == '') {
                ftpS.ftpPort = 21
            }

            var Client = require('ftp');
            var c = new Client();
            c.on('error', function () {
                htmlOutput.insertAdjacentHTML('beforeend', 'FTP Error: ');
            })

            c.on('end', function () {
                htmlOutput.insertAdjacentHTML('beforeend', 'FTP End');
            })

            c.on('close', function () {
                htmlOutput.insertAdjacentHTML('beforeend', 'FTP Closed');
                ipcRenderer.send('show-message-box', 'none', 'FTP UPloaded', 'Site was uploaded.')
                functions.closePopup()
            })

            c.on('ready', function () {
                // get current directory listing
                c.list(ftpS.ftpDirectory, function (err, list) {
                    if (err) throw err;
                    console.dir(list);
                    c.end();
                });
                // remove previous site directory
                c.rmdir(ftpS.ftpDirectory, true, function (err) {
                    if (err) throw err;
                    c.end();
                })
                // get current directory listing
                c.list(ftpS.ftpDirectory, function (err, list) {
                    if (err) throw err;
                    console.dir(list);
                    c.end();
                });

                // create new site directory
                c.mkdir(ftpS.ftpDirectory, true, function (err) {
                    if (err) throw err;
                    c.end();
                })
                // get current directory listing
                c.list(ftpS.ftpDirectory, function (err, list) {
                    if (err) throw err;
                    console.dir(list);
                    c.end();
                });

                // create all the necessary directories
                for (let i = 0; i < subDirs.length; i++) {
                    let dirPath = subDirs[i].replace(localRoot, ftpS.ftpDirectory)
                    c.mkdir(`${dirPath.replace(/\\/g, '/')}`, true, function (err) {
                        if (err) throw err;
                        c.end();
                    });
                }

                // get current directory listing
                c.list(ftpS.ftpDirectory, function (err, list) {
                    if (err) throw err;
                    console.dir(list);
                    c.end();
                });

                // upload all the files
                for (let i = 0; i < filesToUpload.length; i++) {
                    let inString = filesToUpload[i]
                    let outString = inString.replace(localRoot, ftpS.ftpDirectory);
                    // console.log(`in: ${inString}`)
                    // console.log(`out: ${outString.replace(/\\/g, '/')}`)
                    c.put(`${inString}`, `${outString.replace(/\\/g, '/')}`,
                        function (err) {
                            if (err) throw err;
                            c.end();
                        });
                }

                // get current directory listing
                c.list(ftpS.ftpDirectory, function (err, list) {
                    if (err) throw err;
                    console.dir(list);
                    c.end();
                });
            });

            c.connect({
                host: ftpS.ftpHost,
                user: ftpS.ftpUsername,
                password: store.get('ftpPassword'),
                debug: console.log
            });

        } else if (pubMethod == 'github') {
            let sourceBranch = 'source'
            let siteBranch = 'gh-pages'

            // let remoteURL = `https://github.com/${gitHubS.gitHubUsername}/${gitHubS.gitHubRepoName}.git`
            let remoteURL = `git@github.com:${gitHubS.gitHubUsername}/${gitHubS.gitHubRepoName}.git`

            if (gitHubS.gitHubRepoName.includes('.github.io')) {
                siteBranch == 'master'
            }

            if (fs.existsSync(path.join(currentProjectPath.toString(), '.git/'))) {
                // alert('is a Git directory')
                let child;
                if (process.platform !== 'darwin') {
                    child = child_process.spawn(`git checkout ${sourceBranch} && git add -A && git commit -m "push all changes to source" && git push -f origin ${sourceBranch} && git branch -D ${siteBranch} && git checkout -b ${siteBranch} && ren .gitignore gitignore.txt && findstr /V "_site" gitignore.txt > gitignore_new.txt && del gitignore.txt && ren gitignore_new.txt .gitignore. && git add -A && git commit -m "add _site" && git filter-branch --subdirectory-filter _site/ -f && git push -f origin ${siteBranch} && git checkout ${sourceBranch}`, {
                        shell: 'cmd',
                        cwd: currentProjectPath
                    })
                } else {
                    child = child_process.spawn(`git checkout ${sourceBranch} && git add -A && git commit -m "push all changes to source" && git push -f origin ${sourceBranch} && git branch -D ${siteBranch} && git checkout -b ${siteBranch} && sed -i '/_site/d' .gitignore && git add -A && git commit -m "add _site" && git filter-branch --subdirectory-filter _site/ -f && git push -f origin ${siteBranch} && git checkout ${sourceBranch}`, {
                        shell: 'true',
                        cwd: currentProjectPath
                    })
                }

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
                    if (code == 0) {
                        ipcRenderer.send('show-message-box', 'none', 'GitHub UPloaded', 'GitHub Upload Complete')
                        functions.closePopup()
                    }
                });
            } else {
                htmlOutput.innerHTML = ''
                // alert('is not a git directory')
                let child;
                if (process.platform !== 'darwin') {
                    child = child_process.spawn(`git init && git config user.email "${gitHubS.gitHubUserEmail}" && git config user.name "${gitHubS.gitHubUsername}" && git remote add origin ${remoteURL} && git checkout -b ${sourceBranch} && git add -A && git commit -m "push all changes to source" && git push -f origin ${sourceBranch} && git checkout -b ${siteBranch} && ren .gitignore gitignore.txt && findstr /V "_site" gitignore.txt > gitignore_new.txt && del gitignore.txt && ren gitignore_new.txt .gitignore. && git add -A && git commit -m "add _site" && git filter-branch --subdirectory-filter _site/ -f && git push -f origin ${siteBranch} && git checkout source`, {
                        shell: 'cmd',
                        cwd: currentProjectPath
                    })
                } else {
                    child = child_process.spawn(`git init && git config user.email "${gitHubS.gitHubUserEmail}" && git config user.name "${gitHubS.gitHubUsername}" && git remote add origin ${remoteURL} && git checkout -b ${sourceBranch} && git add -A && git commit -m "push all changes to source" && git push -f origin ${sourceBranch} && git checkout -b ${siteBranch} && sed -i '/_site/d' .gitignore && git add -A && git commit -m "add _site" && git filter-branch --subdirectory-filter _site/ -f && git push -f origin ${siteBranch} && git checkout source`, {
                        shell: 'true',
                        cwd: currentProjectPath
                    })
                }
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
                    if (code == 0) {
                        ipcRenderer.send('show-message-box', 'none', 'GitHub UPloaded', 'GitHub Upload Complete')
                    }
                });
            }
        }
    }
})
