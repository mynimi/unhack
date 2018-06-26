const prefs = require('./prefs')
let store = prefs.store

if (store.get('advancedView')) {
    document.querySelector('body').classList.add('advanced-view-on')
} else {
    document.querySelector('body').classList.remove('advanced-view-on')
}

document.querySelector('body').addEventListener('click', function(e){
    if (e.target && e.target.id == 'behind-popup'){
        closePopup();
    }
});

document.querySelector('.popup .close').addEventListener('click', function(){
    closePopup();
});

document.onkeydown = function (evt) {
    evt = evt || window.event;
    if (evt.keyCode == 27) {
        closePopup();
    }
};

function closePopup(){
    const popup = document.querySelector('.popup');
    const body = document.querySelector('body');
    const backdrop = document.querySelector('#behind-popup');
    popup.style.display = 'none'
    body.classList.remove('popup-open')
    backdrop.remove()
}