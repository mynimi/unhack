const functions = require("./functions.js")
const prefs = require('./prefs')
let store = prefs.store

if (store.get('advancedView')) {
    document.querySelector('body').classList.add('advanced-view-on')
} else {
    document.querySelector('body').classList.remove('advanced-view-on')
}

document.querySelector('body').addEventListener('click', function(e){
    if (e.target && e.target.id == 'behind-popup'){
        functions.closePopup();
    }
});

document.querySelector('.popup .close').addEventListener('click', function(){
    functions.closePopup();
});

document.onkeydown = function (evt) {
    evt = evt || window.event;
    if (evt.keyCode == 27) {
        functions.closePopup();
    }
};

