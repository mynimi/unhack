const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const prefs = require('./prefs')
let store = prefs.store

const currentProjectPath = store.get('currentProjectPath').toString()
let lh

document.querySelector('.localhost-info .start').addEventListener('click', function(){
    alert('localhost started')
    // figure this out on non-windows
    lh = child_process.exec('jekyll serve', {
        cwd: currentProjectPath
        })

    lh.stdout.pipe(process.stdout);
    lh.stderr.pipe(process.stderr);
    // lh.stdin.pipe(process.stdin);

    lh.stdin.on('data', function (data) {
        // console.log('stdin: ' + data);
        htmlOutput.insertAdjacentHTML('beforeend', 'stdin: ' + data); //Here is where the output goes
    });
    lh.stdout.on('data', function (data) {
        // console.log('stdout: ' + data);
        htmlOutput.insertAdjacentHTML('beforeend', 'stdout: ' + data); //Here is where the output goes
    });
    lh.stderr.on('data', function (data) {
        // console.log('stderr: ' + data);
        htmlOutput.insertAdjacentHTML('beforeend', 'stderr: ' + data); //Here is where the error output goes
    });
    lh.on('close', function (code) {
        // console.log('closing code: ' + code);
        htmlOutput.insertAdjacentHTML('beforeend', 'closing code: ' + code); //Here you can get the exit code of the script
    });
    lh.on('exit', function(){
        alert('ended')
    })

    setTimeout(function(){
        lh.stdin.write("\x03");
        console.log(lh)
        // lh.close()
        alert('ctrlsent?')
    }, 5000)
    // setTimeout(function () {
    //     lh.kill('SIGINT')
    //     alert('killsent')
    // }, 10000);

    document.querySelector('.localhost-info .stop').addEventListener('click', function () {
        lh.stdin.write("\x03");
        lh.stdin.write("test");
        lh.exit(0)
        // lh.stdin.write("\x03");
        // console.log(lh)
        // lh.kill('SIGINT')
        // killProcess(lh)
        console.log(lh)
    })


})

function killProcess(pr) {
    pr.kill('SIGINT')
    pr.kill()
    // process.exit()
    // ChildProcess.kill()
    process.kill(pr.pid)
    // process.kill(-pr.pid);
}


let htmlOutput = document.querySelector('#localhostoutput')

