var AkariShortener = {};
AkariShortener.timeout = setTimeout(function() {
  // add context menu options listener
  var contextMenu = document.getElementById("contentAreaContextMenu");
  if (contextMenu) {
    contextMenu.addEventListener("popupshowing", AkariShortener.contextItems, false);
  }
}, 100);

AkariShortener.ShortenPage = function() {
  var url = gBrowser.contentWindow.location.href;
  AkariShortener.getShort(url);
}

AkariShortener.ShortenLink = function() {
  var url = gContextMenu.link.href;
  AkariShortener.getShort(url);
}

AkariShortener.ShortenImage = function() {
  var url = gContextMenu.mediaURL;
  AkariShortener.getShort(url);
}

AkariShortener.contextItems = function() {
  var akari_link = document.getElementById("context-akari-link-url");
  var akari_image = document.getElementById("context-akari-image-url");

  akari_link.hidden = (document.popupNode.localName.toLowerCase() != 'a')
  akari_image.hidden = (document.popupNode.localName.toLowerCase() != "img")
}

AkariShortener.transferComplete = function() {
  serverResponse = akariReq.responseText;
  var alertText;
  if(serverResponse.startsWith("http")) {
    const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);
    gClipboardHelper.copyString(serverResponse);
    alertText = "Waai! The URL was shortened and has been copied to the clipboard:\n"+serverResponse;
  } else {
    alertText = "Something went wrong:\n"+serverResponse;
  }
  Components.classes["@mozilla.org/alerts-service;1"].getService(Components.interfaces.nsIAlertsService).showAlertNotification("chrome://akari/content/icons/icon.png", "Akari URL Shortener", alertText);
}

AkariShortener.getShort = function(u) {
  // decode url first to be safe
  var url = decodeURIComponent(u);
  url = encodeURIComponent(u);

  akariReq = new XMLHttpRequest();
  akariReq.open('GET', 'http://api.waa.ai/?url='+url, true);

  // Once request is finished
  akariReq.addEventListener("load", function () { AkariShortener.transferComplete(); });

  akariReq.send();
}

Components.utils.import("resource:///modules/CustomizableUI.jsm");
CustomizableUI.createWidget({
  id: "akari-shortener-button",
  defaultArea: "nav-bar",
  removable: true,
  label: "Akari",
  tooltiptext: "Akari Link Shortener",
  onCommand: function (e) {
  AkariShortener.ShortenPage();
  }
});