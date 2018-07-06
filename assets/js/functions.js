"use strict"
const fs = require('fs')
const path = require('path')
const prefs = require('./prefs')
let store = prefs.store


// build HTML Path for given file
module.exports.htmlPath = function htmlPath(filename) {
    return path.join(__dirname, '..', 'html', filename+'.html');
}
module.exports.retrieveMeta = function retrieveMeta(template,parent, child, config){
    let prop = parent[child]

    if (prop.display == 'global' || prop.display == template) {
        if (!prop.type) {
            prop.type = 'text'
        }

        if (prop.type == 'text' || prop.type == 'date' || prop.type == 'number') {
            config[child] = document.querySelector(`input[name="${child}"]`).value        
        }
        if (prop.type == "radio" || prop.type == 'checkbox') {
            let options = prop.options
            config[child] = document.querySelector(`input[name="${options}"]:checked`).value
        }
        if (prop.type == 'textarea') {
            config[child] = document.querySelector(`textarea[name="${child}"]`).value
        }
        if (prop.type == 'image') {
            // return image src
        }
    }        
    return config;
}

module.exports.generateMeta = function generateMeta(template,parent, child, initialVal){
    let prop = parent[child]
    let output = ''
    let help

    if(prop.help){
        help = `<p class="small help"><i class="fas fa-info-circle"></i> ${prop.help}</p>`
    } else {
        help = ''
    }
    if(prop.display == 'global' || prop.display == template){
        if (!initialVal) {
            if (prop.defaults){
                initialVal = prop.defaults[template]
            } else if(prop.type == 'date'){
                initialVal = new Date().toDateInputValue()
            } else{
                initialVal = ''
            }        
        }

        if (!prop.type) {
            prop.type = 'text'
        }

        if (prop.type == 'text' || prop.type == 'date' || prop.type == 'number') {
            output =
                `<div class="wrap">
                        <label for="${child}">${child.toProperCase()}</label>
                        <input type="${prop.type}" name="${child}" id="${child}" value="${initialVal}" ${(prop.maxlength) ? `maxlength="${prop.maxlength}"` : ''}>
                        ${help}
                    </div>`
        }
        if (prop.type == "radio" || prop.type == 'checkbox') {
            output =
                `<div class="${prop.type} input">
                    <div class="label">${child.toProperCase()}</div>`
            let options = prop.options
            for (let o in options){
                if(options.hasOwnProperty(o)){
                    output += `<input id="${options[o]}" name="${options}" value="${options[o]}" type="${prop.type}" ${(options[o] == initialVal) ? 'checked' : ''} ${(prop.maxlength) ? `maxlength="${prop.maxlength}"` : ''}>`
                    output += `<label for="${options[o]}">${options[o].toString().toProperCase()}</label>`
                    output += '<br>'
                }
            }
            if(!options.indexOf(initialVal) > -1){
                output += `<p class="small note">The current Value does not seem to be an available option, choose one of the available options, or fix settings</p>`
            }
            output += `${help}</div>`
        }
        if (prop.type == 'textarea') {
            output =
                `<div class="wrap">
                <label for="${child}">${child.toProperCase()}</label>
                <textarea name="${child}" id="${child}" ${(prop.maxlength) ? `maxlength="${prop.maxlength}"` : ''}>${initialVal}</textarea>
                ${help}
            </div>`
        }
        if (prop.type == 'image') {
            output = 
                    `<div class="wrap">
                    <label class="up" for="${child}">${child.toProperCase()}</label>
                    <div class="feat-img">${(initialVal != '') ? `<img src="${initialVal}">` : ''}</div>
                    <button class="btn media-chooser">Choose File</button>
                    ${help}
                    </div>`
        }

    }
        return output

}

String.prototype.toProperCase = function () {
    return this.replace('_', ' ').replace('-', ' ').replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

Date.prototype.toDateInputValue = (function () {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0, 10);
});

module.exports.addToConfig = function addToConfig(addConfig){
    const configPath = store.get('configFilePath')
    if (configPath) {
        // console.log(configPath)
        fs.readFile(configPath.toString(), (err, data) => {
            if (err) throw err
            let oldConfig = JSON.parse(data)
            let newConfig = { ...oldConfig, ...addConfig}
            // console.log(oldConfig)
            // console.log(addConfig)
            // console.log(newConfig)

            fs.writeFile(configPath.toString(), JSON.stringify(newConfig, null, 2), (err) => {
                if (err) throw err
            })
        })
    } else {
        console.log('no config File Path')
    }
}

module.exports.deleteFile = function deleteFile(filePath) {
    fs.unlink(filePath, (err) => {
        if (err) throw err;
        alert(`${filePath} was deleted`)
    })
}

module.exports.slugify = function slugify(string) {
    const a = 'àáäâãåèéëêìíïîòóöôùúüûñçßÿœæŕśńṕẃǵǹḿǘẍźḧ·/_,:;'
    const b = 'aaaaaaeeeeiiiioooouuuuncsyoarsnpwgnmuxzh------'
    const p = new RegExp(a.split('').join('|'), 'g')

    return string.toString().toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
        .replace(/&/g, '-and-') // Replace & with 'and'
        .replace(/[^\w\-]+/g, '') // Remove all non-word characters
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, '') // Trim - from end of text
}

module.exports.copyFile = function copyFile(source, target, cb) {
    var cbCalled = false;

    var rd = fs.createReadStream(source);
    rd.on("error", function (err) {
        done(err);
    });
    var wr = fs.createWriteStream(target);
    wr.on("error", function (err) {
        done(err);
    });
    wr.on("close", function (ex) {
        done();
    });
    rd.pipe(wr);

    function done(err) {
        if (!cbCalled) {
            cb(err);
            cbCalled = true;
        }
    }
}

// open Popup function
module.exports.openPopup = function openPopup() {
    const body = document.querySelector('body')
    body.classList.add('popup-open')
    let behindPopup = document.createElement("div")
    behindPopup.id = 'behind-popup'
    body.appendChild(behindPopup)
    let popup = document.querySelector('.popup')
    popup.style.display = 'block'
}

module.exports.closePopup = function closePopup() {
    const popup = document.querySelector('.popup');
    const body = document.querySelector('body');
    const backdrop = document.querySelector('#behind-popup');
    popup.style.display = 'none'
    body.classList.remove('popup-open')
    backdrop.remove()
}

module.exports.getPages = function getPages(dir, filelist = []) {
    fs.readdirSync(dir).forEach(file => {
        // console.log(path.extname(file))
        if(path.extname(file) == '.html' || path.extname(file) == '.markdown' || path.extname(file) == '.md'){
            // console.log(file)
            const dirFile = path.join(dir, file);
            try {
                filelist = getPages(dirFile, filelist);
            } catch (err) {
                if (err.code === 'ENOTDIR' || err.code === 'EBUSY') filelist = [...filelist, dirFile];
                else throw err;
            }
        }
    });
    return filelist;
}


// List all Files in Given Directory
module.exports.getPathsInDir = function getPathsInDir(dir, filelist = []) {
    fs.readdirSync(dir).forEach(file => {
        const dirFile = path.join(dir, file);
        try {
            filelist = getPathsInDir(dirFile, filelist);
        } catch (err) {
            if (err.code === 'ENOTDIR' || err.code === 'EBUSY') filelist = [...filelist, dirFile];
            else throw err;
        }
    });
    return filelist;
}

// Styling Input functionality, has to be exported due to being reloaded on dynamically created elements
module.exports.inputStyle = function inputStyle(){
    let inputs = document.querySelectorAll('.wrap input, .wrap textarea')

    inputs.forEach(function (elem, index) {
        styleInput(elem, 'initial')
        elem.addEventListener('focus', function () {
            styleInput(this, 'focus')
            // console.log('focus')
        })
        elem.addEventListener('blur', function () {
            styleInput(this, 'blur')
            // console.log('blur')
        })
    });
}

function styleInput(e, a) {
    let elName = e.name
    let elLabel = document.querySelector(`label[for="${elName}"]`)
    if (a == 'initial' || 'blur') {
        if (e.placeholder || e.value || e.type == 'date' || e.classList.contains('file')) {
            elLabel.classList.add('up')
        } else {
            elLabel.classList.remove('up')
        }
    }
    if (a == 'focus') {
        elLabel.classList.add('up')
        e.parentNode.classList.add('focus')
    }
    if (a == 'blur') {
        e.parentNode.classList.remove('focus')
    }
}

module.exports.loadMediaGallery = function loadMediaGallery(mediaLibraryPath, popupContent, mediaFolder, editor) {
    // let squire = document.querySelectorAll('[id*="squire"], [class*="squire"]')
    // console.log(squire)
    // squire.forEach(e => e.parentNode.removeChild(e));
    
    fs.readFile(mediaLibraryPath, (err, data) => {
        popupContent.innerHTML = data
        exports.inputStyle()
        exports.fillGallery(mediaFolder)
        popupContent.addEventListener('click', function (e) {
            if (e.target && e.target.src) {
                let el = e.target
                let src = el.src
                exports.closePopup()
                // TODO FIGURE OUT HOW TO MAKE THIS WORK MORE THAN ONCE!
                // editor.insertText(`![${path.basename(src)}]({{ "/assets/${path.basename(src)}" | absolute_url }})`)
            }
        });
        document.ondragover = document.ondrop = (ev) => {
            ev.preventDefault()
        }
        const dropArea = document.querySelector('.droppable')
        dropArea.ondrop = (ev) => {
            imageToAdd = ev.dataTransfer.files[0].path

            ev.preventDefault()

            dropArea.classList.remove('dragging')

            if (imageToAdd.toString().includes(mediaFolder.toString())) {
                alert('File is already in Assets Folder')
            } else {
                let newImagePath = path.join(mediaFolder, path.basename(imageToAdd))
                exports.copyFile(imageToAdd, newImagePath, function () {
                    exports.fillGallery(mediaFolder)
                    alert('File Added')
                })
            }

        }
        dropArea.ondragenter = (ev) => {
            dropArea.classList.add('dragging')
        }
        dropArea.ondragleave = (ev) => {
            dropArea.classList.remove('dragging')
        }
    })
    exports.openPopup()
}

module.exports.fillGallery = function fillGallery(mediaFolder) {
    let images = exports.getPathsInDir(mediaFolder.toString())
    let lib = ``
    for (let img in images) {
        lib += `<img src="${images[img]}" alt="${path.basename(images[img])}">`
    }
    document.querySelector('.media-gallery').innerHTML = lib
}