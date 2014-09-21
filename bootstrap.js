Components.utils.import('resource://gre/modules/Services.jsm');
let id = "AkariShortener";

function startup(data, reason) {

    Components.utils.import('chrome://akari/content/akari.js');
    AkariShortener.init(id);
    forEachOpenWindow(loadIntoWindow); // load into all open windows
    Services.wm.addListener(WindowListener); // listener for new windows
}

function shutdown(data, reason) {

    if (reason === APP_SHUTDOWN) {
        return;
    }

    forEachOpenWindow(unloadFromWindow); // unload from all open windows
    Services.wm.removeListener(WindowListener); // remove listener for new windows
    AkariShortener.uninit(id);
    Components.utils.unload('chrome://akari/content/akari.js'); // unload JS
}

function install(data, reason) {}
function uninstall(data, reason) {}

function loadIntoWindow(window) {
    AkariShortener.load(window);
}

function unloadFromWindow(window) {

    let event = new(window.CustomEvent)(id + '-unload');
    window.dispatchEvent(event);
}

function forEachOpenWindow(todo) {

    let windows = Services.wm.getEnumerator('navigator:browser');
    while (windows.hasMoreElements()) {
        todo(windows.getNext().QueryInterface(Components.interfaces.nsIDOMWindow));
    }
}

let WindowListener = {

    onOpenWindow: function(xulWindow) {
        let window = xulWindow.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIDOMWindow);

        function onWindowLoad() {
            window.removeEventListener('load', onWindowLoad, false);
            if (window.document.documentElement.getAttribute('windowtype') === 'navigator:browser') {
                loadIntoWindow(window);
            }
        }
        window.addEventListener('load', onWindowLoad, false);
    },

    onCloseWindow: function(xulWindow) {},

    onWindowTitleChange: function(xulWindow, newTitle) {}
};