Components.utils.import('resource://gre/modules/Services.jsm');
Components.utils.import("resource:///modules/CustomizableUI.jsm");
// Components.utils.import('resource://gre/modules/devtools/Console.jsm');
const XMLHttpRequest = Components.Constructor("@mozilla.org/xmlextras/xmlhttprequest;1", "nsIXMLHttpRequest");
let devtools = Components.utils.import('resource://gre/modules/devtools/Loader.jsm', {}).devtools;
let gcli = devtools.require('gcli/index');
let window = Services.ww.activeWindow;

let EXPORTED_SYMBOLS = ['AkariShortener'];

var AkariShortener = {

  init: function(id) {
    this.id = id;
    this.window = window;
    let styleSheetService = Components.classes["@mozilla.org/content/style-sheet-service;1"].getService(Components.interfaces.nsIStyleSheetService);
    styleSheetService.loadAndRegisterSheet((Services.io.newURI("chrome://akari/skin/button.css", null, null)), styleSheetService.AUTHOR_SHEET);
    // Validator complains (`loadAndRegisterSheet`), snippet was taken from MDN.

    CustomizableUI.createWidget({
      id: "akari-shortener-button",
      defaultArea: "nav-bar",
      removable: true,
      label: "Akari",
      tooltiptext: "Akari Link Shortener",
      onCommand: function(aEvent) {
        this.AkariShortener.ShortenPage();
      }
    });
    gcli.addItems([{
      name: 'akari',
      description: 'Shorten URLs using http://waa.ai',
      params: [{
        name: 'url',
        type: 'string',
        defaultValue: null,
        description: 'URL to shorten',
        manual: 'URL to be shortened. If no URL is specified, the URL of the current tab is used.'
      }],
      returnType: 'string',
      exec: function(args, context) {
        return this.AkariGCLI(args.url);
      },
      AkariGCLI: function(url) {
        if (!url) {
          AkariShortener.ShortenPage();
        } else {
          AkariShortener.ShortenPage(url);
        }
      }
    }]);
  },
  uninit: function(id) { // per session uninitialise function

    CustomizableUI.destroyWidget("akari-shortener-button");
    gcli.removeItems(['akari']);
    let styleSheetService = Components.classes["@mozilla.org/content/style-sheet-service;1"].getService(Components.interfaces.nsIStyleSheetService);
    if (styleSheetService.sheetRegistered((Services.io.newURI("chrome://akari/skin/button.css", null, null)), styleSheetService.AUTHOR_SHEET)) {
      styleSheetService.unregisterSheet(styleSheetURI, styleSheetService.AUTHOR_SHEET);
    }
  },

  load: function(window) {

    this.window = window;

    let contextMenu = this.window.document.getElementById("contentAreaContextMenu");
    contextMenu.addEventListener('popupshowing', this, false);
    if (!contextMenu) {
      return;
    }

    window.addEventListener('unload', this, false);
    window.addEventListener(this.id + '-unload', this, false);

    let docfrag = window.document.createDocumentFragment();
    let menuitem = window.document.createElement('menuitem');
    menuitem.setAttribute("class", "menuitem-iconic");
    menuitem.setAttribute("image", "chrome://akari/skin/bun16.png");

    this.akari_url = menuitem.cloneNode(false);
    this.akari_link = menuitem.cloneNode(false);
    this.akari_image = menuitem.cloneNode(false);
    akari_url = this.akari_url;
    akari_link = this.akari_link;
    akari_image = this.akari_image;

    akari_url.setAttribute("id", "context-akari-current-page");
    akari_url.setAttribute("label", "Akarin~ Shorten Current Page");
    akari_url.addEventListener('command', this, false);

    akari_link.setAttribute("id", "context-akari-link-url");
    akari_link.setAttribute("label", "Akarin~ Shorten Link URL");
    akari_link.addEventListener('command', this, false);

    akari_image.setAttribute("id", "context-akari-image-url");
    akari_image.setAttribute("label", "Akarin~ Shorten Image URL");
    akari_image.addEventListener('command', this, false);

    docfrag.appendChild(akari_url);
    docfrag.appendChild(akari_link);
    docfrag.appendChild(akari_image);
    contextMenu.appendChild(docfrag);

    this.removeChildren = [akari_url, akari_link, akari_image];
    this.removeListener = [
      [akari_url, "command"],
      [akari_link, "command"],
      [akari_image, "command"],
      [contextMenu, 'popupshowing'],
      [this.akariReq, "load"],
      [this.akariReq, "error"],
      [window, 'unload'],
      [window, this.id + '-unload']
    ];
  },

  unload: function() {
    let arr = this.removeChildren || [];
    for (let i = 0, len = arr.length; i < len; i++) {
      arr[i].parentNode.removeChild(arr[i]);
    }

    arr = this.removeListener || [];
    for (let i = 0, len = arr.length; i < len; i++) {
      arr[i][0].removeEventListener(arr[i][1], this, false); // [target, event] pairs
    }
  },

  handleEvent: function(event) {
    switch (event.type) {
      case 'popupshowing':
        this.contextPopupShowing();
        break;
      case 'command':
        switch (event.target.id) {
          case 'context-akari-current-page':
            this.ShortenPage();
            break;
          case 'context-akari-link-url':
            this.ShortenLink();
            break;
          case 'context-akari-image-url':
            this.ShortenImage();
            break;
        }
        break;
      case 'unload':
      case this.id + '-unload':
        this.unload();
        break;
    }
  },

  contextPopupShowing: function() {
    this.akari_link.hidden = true;
    this.akari_image.hidden = true;
    if (Services.ww.activeWindow.gContextMenu.onImage) {
      this.akari_image.hidden = false;
    } else if (Services.ww.activeWindow.gContextMenu.onLink) {
      this.akari_link.hidden = false;
    }
  },

  ShortenPage: function(url) {
    if (typeof url === 'object' || typeof url === 'undefined') {
      url = Services.ww.activeWindow.gBrowser.contentWindow.location.href;
    } else {
      this.url = url;
    }
    AkariShortener.getShort(url);
  },

  ShortenLink: function() {
    var url = this.window.gContextMenu.link.href;
    AkariShortener.getShort(url);
  },

  ShortenImage: function() {
    var url = this.window.gContextMenu.mediaURL;
    AkariShortener.getShort(url);
  },

  transferComplete: function(responseText) {
    serverResponse = JSON.parse(responseText);
    var alertText;
    if (serverResponse.success === true && serverResponse.status === 200) {
      Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper).copyString(serverResponse.data.url);
      alertText = "Waai! The URL was shortened and has been copied to the clipboard:\n" + serverResponse.data.url;
      this.AkariNotification(alertText);
    } else {
      alertText = "Something went wrong:\n" + serverResponse.data.error;
      this.AkariNotification(alertText);
    }
  },

  AkariNotification: function(alertText) {
    Components.classes["@mozilla.org/alerts-service;1"].getService(Components.interfaces.nsIAlertsService).showAlertNotification("chrome://akari/skin/icon.png", "Akari URL Shortener", alertText);
  },

  getShort: function(u) {
    // decode url first to be safe
    var url = decodeURIComponent(u);
    if (url.match(/^(about:|chrome:|resource:|jar:|file:|view-source:|undefined)/)) {
      alertText = "This URL cannot be shortened!";
      this.AkariNotification(alertText);
    } else {
      url = encodeURIComponent(u);

      var akariReq = new XMLHttpRequest();
      akariReq.open("GET", "http://api.waa.ai/shorten?url=" + url, true);

      // Once request is finished
      akariReq.addEventListener("load", function() {
        AkariShortener.transferComplete(this.responseText);
      });

      akariReq.addEventListener("error", function() {
        alertText = "Network error!";
        AkariShortener.AkariNotification(alertText);
      });

      akariReq.send();
    }
  }
};