const prefs = require('./prefs')
let store = prefs.store

if (store.get('advancedView')) {
    document.querySelector('body').classList.add('advanced-view-on')
} else {
    document.querySelector('body').classList.remove('advanced-view-on')
}
