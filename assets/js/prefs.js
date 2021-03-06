const Store = require('electron-store');
const store = new Store({
    name: 'user-preferences',
    defaults: {
        windowBounds: {
            width: 1000,
            height: 700
        },
        uiSkin: 'light',
        advancedView: false,
        projectName: 'Create Site'
    }
});

exports.store = store