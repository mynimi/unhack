"use strict";

const path = require('path');

// build HTML Path for given file
module.exports.htmlPath = function htmlPath(filename) {
    return path.join(__dirname, '..', 'html', filename+'.html');
}

module.exports.openPopup = function openPopup() {
    const body = document.querySelector('body')
    body.classList.add('popup-open')
    const behindPopup = document.createElement("div")
    behindPopup.id = 'behind-popup'
    body.appendChild(behindPopup)
    const popup = document.querySelector('.popup')
    popup.style.display = 'block'
}

// Styling Input functionality, has to be exported due to being reloaded on dynamically created elements
module.exports.inputStyle = function inputStyle(){
    let inputs = document.querySelectorAll('.wrap input, .wrap textarea')

    inputs.forEach(function (elem, index) {
        styleInput(elem, 'initial')
        elem.addEventListener('focus', function () {
            styleInput(this, 'focus')
            console.log('focus')
        })
        elem.addEventListener('blur', function () {
            styleInput(this, 'blur')
            console.log('blur')
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