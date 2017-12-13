(((akari, page, storage, chrome) => {
    akari.page = akari.extend({}, page, {
        load() {
            document.getElementById("popupIcon").src = akari.getNotificationIcon();

            chrome.tabs.query({
                    active: true,
                    windowId: chrome.windows.WINDOW_ID_CURRENT
                },
                tabsArray => {
                    let callback;
                    const tab = tabsArray[0]; // Only one active tab so only one element in the array.
                    const textbox = document.getElementById("textbox");
                    const message = document.getElementById("message");
                    const useNotification = akari.storage.get("settings.useNotification");

                    const notificationCallback = result => {
                        if (result.success === true) {
                            akari.copyToClipboard(textbox, result.link);
                            akari.displayNotification(result);

                            if (akari.shouldPlaySoundEffect()) {
                                akari.playSoundEffect();
                            }
                        } else {
                            akari.copyToClipboard(textbox, result.error);
                            akari.displayNotification(result.error);
                        }
                    };

                    const popupCallback = result => {
                        if (result.success === true) {
                            textbox.value = result.link;
                            akari.copyToClipboard(textbox);
                            message.textContent = "Link copied to clipboard.";

                            if (akari.shouldPlaySoundEffect()) {
                                akari.playSoundEffect();
                            }
                        } else {
                            textbox.value = result.error;
                            message.textContent = "Something went wrong!";
                        }
                    };

                    if (useNotification) {
                        callback = notificationCallback;
                    } else {
                        callback = popupCallback;
                    }

                    akari.shortenUrl(tab.url, callback);
                });
        }
    });
}))(window.akari, window.akari.page, window.akari.storage, chrome);