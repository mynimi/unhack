const functions = require("./functions.js")
const prefs = require('./prefs')
let store = prefs.store

const {
    ipcRenderer,
    shell
} = require('electron');

let popupContent = document.querySelector('.popup .content-loader')
let alert = document.querySelector('.alert')

if (store.get('advancedView')) {
    document.querySelector('body').classList.add('advanced-view-on')
} else {
    document.querySelector('body').classList.remove('advanced-view-on')
}

document.querySelector('body').addEventListener('click', function(e){
    if (e.target && e.target.id == 'behind-popup'){
        popupContent.innerHTML = ''
        functions.closePopup();
    }
    if(e.target && e.target.classList.contains('open-in-browser')){
        e.preventDefault()
        shell.openExternal(e.target.href);
    }
});

document.querySelector('.popup .close').addEventListener('click', function(){
    popupContent.innerHTML = ''
    functions.closePopup();
});

document.onkeydown = function (evt) {
    evt = evt || window.event;
    if (evt.keyCode == 27) {
        popupContent.innerHTML = ''
        functions.closePopup();
    }
};

// Change UI Skin
let currentSkin = store.get('uiSkin')
let sS = document.querySelector('#main-style')

if (currentSkin == "light") {
    sS.href = "assets/css/main.css"    
} else {
    sS.href = "assets/css/dark.css"
}

ipcRenderer.on('toggle-dark-mode', function () {
    changeUIStyle(store.get('uiSkin'), sS);
})

function changeUIStyle(currentSkin, sS) {
    if(currentSkin == "light"){
        sS.href = "assets/css/dark.css"
        store.set('uiSkin', 'dark')
    } else {
        sS.href = "assets/css/main.css"
        store.set('uiSkin', 'light')
    }
}

alert.classList.add('hidden')

document.querySelector('.alert .close').addEventListener('click', function(e){
    document.querySelector('.alert').classList = 'alert hidden'
})