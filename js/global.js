const preload = {
    /**
     * Migrate history which was terribly implemented.
     * This can eventually be removed.
     */
    migrateHistory() {
        let links = localStorage["links"];
        const history = {};
        let link, longUrl, shortCode, shortUrl, statsUrl, shortCodeTmp, ext, i;

        if (!links) {
            // previous history has already been migrated
            // or doesn't exist.
            return;
        }

        links = links.split("|");

        if (links.length === 0) {
            localStorage.removeItem("links");
            return;
        }

        links.reverse();

        for (i = 0; i < links.length; i++) {
            link = links[i].split("*");
            shortUrl = link[0];
            longUrl = link[1];

            shortCode = shortUrl.substring(shortUrl.lastIndexOf("waa.ai/") + 1);
            ext = false;

            if (shortCode.indexOf(".") !== 0) {
                shortCodeTmp = shortCode.split(".", 1);
                shortCode = shortCodeTmp[0];
                ext = `.${shortCodeTmp[1]}`;
            }

            statsUrl = `https://stats.waa.ai/${shortCode}`;

            history[shortCode] = {
                longUrl,
                shortCode,
                shortUrl,
                statsUrl: `https://stats.waa.ai/${shortCode}`,
                extension: ext,
                timestamp: Date.now()
            };
        }

        localStorage["history"] = JSON.stringify(history);
        localStorage.removeItem("links");
    },

    /**
     * Put all settings in one json object... ffs
     * This can eventually be removed.
     */
    migrateSettings() {
        let settings;

        if (!!localStorage["settings"]) {
            return;
        }

        settings = {
            apiKey: (localStorage["apiKey"]) ? localStorage["apiKey"] : "",
            akarinLinks: false, // new setting
            privateLinks: false, // new setting
            playSoundEffect: localStorage["playSoundEffect"] === "true",
            soundEffectVolume: .1, // new setting - default to ".1"
            history: (localStorage["history"]) ? localStorage["history"] : null,
            linksPerPage: 25, // default 25 TODO -- make this configurable
            notificationLongUrl: false, // new setting - default false
            notificationRandomImage: false, // new setting - default false
            useNotification: false // new setting - default false
        };

        localStorage["settings"] = JSON.stringify(settings);

        // remove old settings
        localStorage.removeItem("playSoundEffect");
        localStorage.removeItem("history");
        localStorage.removeItem("apiKey");
    }
};

// TODO - Remove this eventually...
preload.migrateHistory();
preload.migrateSettings();

window.akari = {

    settingsMigrated: !!localStorage["settings"],

    birthdays: {
        "03-28": "kyouko",
        "11-06": "chinatsu",
        "04-14": "yui",
        "09-07": "sakurako",
        "06-16": "himawari",
        "01-20": "ayano",
        "05-23": "rise",
        "03-10": "chitose"
        //"03-10": "chizuru" handle twins case :)
    },

    // Just a simple array for now since there's only 1 set of twins
    characterTwins: [
        "chitose",
        "chizuru"
    ],

    extend() {
        for (let i = 1; i < arguments.length; i++)
            for (const key in arguments[i])
                if (arguments[i].hasOwnProperty(key))
                    arguments[0][key] = arguments[i][key];
        return arguments[0];
    },

    shouldPlaySoundEffect() {
        return window.akari.storage.get("settings.playSoundEffect");
    },

    playSoundEffect() {
        const soundEffect = new Audio();
        let volume = window.akari.storage.get("settings.soundEffectVolume");

        if (!volume) {
            volume = .1
        }

        soundEffect.volume = volume;
        soundEffect.src = "audio/akarin.mp3";
        soundEffect.play();
    },

    shortenUrl(url, callback) {
        const originalUrl = decodeURIComponent(url); // decode url first to be safe
        const encodedUrl = encodeURIComponent(originalUrl);
        let apiUrl = "https://api.waa.ai/shorten?url=";
        const usesUserAccount = !!this.storage.get("settings.apiKey");
        let result = {};
        const that = this;
        let xhr;

        if (originalUrl.substring(0, 4) !== "http") {
            result.success = false;
            result.error = "This URL can't be shortened.";
            callback(result);
            return;
        }

        xhr = new XMLHttpRequest();

        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                let shortUrl, shortCode, longUrl, extension, history;
                const response = JSON.parse(xhr.responseText);

                if (xhr.status === 200) {
                    // example response (success)
                    // {"data" : { "url" : "http:\/\/waa.ai\/{short_code}" }, "success" : true, "status" : 200 }
                    shortUrl = response.data.url;
                    shortCode = response.data.short_code;
                    extension = response.data.extension;
                    longUrl = response.data.long_url;
                    deleteUrl = response.data.delete_link;

                    if (extension) {
                        extension = `.${extension}`;
                    }

                    if (!usesUserAccount) {
                        if (that.storage.get("history")) {
                            history = that.storage.get("history");
                        } else {
                            history = {};
                        }

                        history[shortCode] = {
                            longUrl: originalUrl,
                            deleteUrl,
                            shortCode,
                            shortUrl,
                            statsUrl: `https://stats.waa.ai/${shortCode}`,
                            extension,
                            timestamp: Date.now()
                        };

                        that.storage.set("history", history);
                    }

                    result = {
                        success: true,
                        link: shortUrl,
                        longUrl,
                        deleteUrl
                    };

                    callback(result);

                } else {
                    // example response (error)
                    // {"data" : { "error" : "error message" }, "success" : false, "status" : 400 }
                    result.success = false;
                    result.error = response.data.error;
                    callback(result);
                }
            }
        };

        apiUrl += encodedUrl;

        if (this.storage.get("settings.apiKey")) {
            apiUrl += `&key=${btoa(this.storage.get("settings.apiKey"))}`;
        }

        if (this.storage.get("settings.privateLinks") === true) {
            apiUrl += "&private=1";
        }

        if (this.storage.get("settings.akarinLinks") === true) {
            apiUrl += "&akarin=1";
        }

        apiUrl += "&client_id=1e8929da1m92acbc40fr";

        xhr.open("GET", apiUrl);
        xhr.send();
    },

    getNotificationIcon() {
        let birthdayDate, characters, key;
        let date = new Date();
        let day = date.getDate();
        let month = date.getMonth() + 1;
        let character = "akari";

        if (akari.storage.get("settings.notificationRandomImage")) {
            characters = [];

            for (key in this.birthdays) {
                if (!this.birthdays.hasOwnProperty(key)) {
                    return;
                }

                characters.push(this.birthdays[key]);
            }

            character = this.getRandomNotificationImage(characters);

            return this.getCharacterIcon(character);
        }

        if (day < 10) {
            day = `0${day}`;
        }

        if (month < 10) {
            month = `0${month}`;
        }

        birthdayDate = `${month}-${day}`;

        if (this.birthdays.hasOwnProperty(birthdayDate)) {
            character = this.birthdays[birthdayDate];
        }

        // Handle Chitose and Chizuru twins
        if (character === "chitose") {
            character = this.getRandomNotificationImage(this.characterTwins);
            //character = this.characterTwins[Math.floor(Math.random() * this.characterTwins.length)];
        }

        return this.getCharacterIcon(character);
    },

    getCharacterIcon(character) {
        return `img/icons/${character}.png`;
    },

    /**
     * Gets random value form array
     *
     * @param array
     * @returns {*}
     */
    getRandomNotificationImage(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    displayNotification(result) {
        let longUrl;
        const options = {
            type: "basic",
            title: "Akari Link Shortener",
            contextMessage: "Copied to clipboard",
            iconUrl: akari.getNotificationIcon()
        };

        if (typeof result === "string") {
            options.message = result;
        } else {
            options.message = `Waai! The URL was shortened and has been copied to the clipboard:\n\n${result.link}`;

            if (akari.storage.get("settings.notificationLongUrl")) {
                longUrl = result.longUrl;

                if (longUrl.length > 60) {
                    longUrl = `${longUrl.substring(0, 45)}...`;
                }

                options.buttons = [{
                    title: longUrl
                }];
            }
        }

        chrome.notifications.create(
            "akari",
            options,
            () => {}
        );

        setTimeout(() => {
            chrome.notifications.clear(
                "akari",
                () => {}
            );
        }, 5000);
    },

    copyToClipboard(element, text) {
        if (element == undefined) {
            return;
        }

        if (text) {
            element.value = text;
        }

        element.focus();
        element.select();
        document.execCommand("copy");
    },

    updateUseNotification() {
        const akari = window.akari;

        if (akari.storage.get("settings.useNotification")) {
            if (!chrome.browserAction.onClicked.hasListeners()) {
                chrome.browserAction.onClicked.addListener(this._alwaysUseNotifications);
            }
            chrome.browserAction.setPopup({
                popup: ""
            });
        } else {
            chrome.browserAction.onClicked.removeListener(this._alwaysUseNotifications);
            chrome.browserAction.setPopup({
                popup: "popup.html"
            });
        }
    },

    _alwaysUseNotifications(tab) {
        chrome.tabs.query({
                active: true,
                windowId: chrome.windows.WINDOW_ID_CURRENT
            },
            tabsArray => {
                let callback;
                const tab = tabsArray[0]; // Only one active tab so only one element in the array.
                const input = document.createElement("textarea");
                const useNotification = akari.storage.get("settings.useNotification");

                document.body.appendChild(input);

                callback = result => {
                    if (result.success === true) {
                        akari.copyToClipboard(input, result.link);
                        akari.displayNotification(result);

                        if (akari.shouldPlaySoundEffect()) {
                            akari.playSoundEffect();
                        }
                    } else {
                        akari.copyToClipboard(input, result.error);
                        akari.displayNotification(result.error);
                    }
                };

                akari.shortenUrl(tab.url, callback);
            });
    }
};

window.akari.page = {
    load() {} // override me
};

window.akari.storage = {

    /**
     * Gets a json parsed value from local storage
     *
     * @param key
     * @returns {*}
     */
    get(key) {
        let obj;
        let settings;

        if (key.includes(".")) {
            key = key.split(".");
            obj = key[0];
            key = key[1];
        }

        if (window.akari.settingsMigrated) {
            if (obj) {
                if (!localStorage[obj]) {
                    return undefined;
                }

                settings = JSON.parse(localStorage[obj]);

                if (settings.hasOwnProperty(key)) {
                    return settings[key];
                }
            } else {
                if (localStorage[key]) {
                    return JSON.parse(localStorage[key]);
                }
            }

            return undefined;
        } else {
            // TODO -- remove this eventually...
            return localStorage[key];
        }
    },

    /**
     * Set and individual key.
     * Store everything in settings object
     *
     * @param key
     * @param value
     */
    set(key, value) {
        let obj;
        let settings;

        if (key.includes(".")) {
            key = key.split(".");
            obj = key[0];
            key = key[1];
        }

        if (window.akari.settingsMigrated) {
            if (obj) {
                settings = JSON.parse(localStorage[obj]);

                if (typeof settings === "object") {
                    settings[key] = value;
                    localStorage[obj] = JSON.stringify(settings);
                }
            } else {
                localStorage[key] = JSON.stringify(value);
            }
        } else {
            // TODO -- remove this eventually...
            localStorage[key] = value;
        }
    },

    /**
     * Set the whole settings object
     *
     * @param settings
     */
    setSettings(settings) {
        localStorage["settings"] = JSON.stringify(settings);
    },

    getSettings() {
        return JSON.parse(localStorage["settings"]);
    },

    remove(key) {
        localStorage.removeItem(key);
    }
};

window.akari.xhr = {
    /**
     *
     * @param type {string}"
     * @param url {string}
     * @param callback {function}
     * @param errCallback {function}
     * @param data {object}
     */
    xhr(type, url, callback, errCallback, data) {
        const xhr = new XMLHttpRequest();

        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                let response;

                if (xhr.status === 200) {
                    response = JSON.parse(xhr.responseText);
                    callback(response);
                } else if (xhr.status === 401) {
                    response = JSON.parse(xhr.responseText);
                    errCallback(response);
                } else {
                    errCallback({
                        error: "Something went wrong"
                    });
                }
            }
        };

        xhr.open(type.toUpperCase(), url);
        if (data) {
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(JSON.stringify(data));
        } else {
            xhr.send();
        }

    },

    getReq(url, callback, errCallback) {
        const type = "GET";
        const data = null;

        this.xhr(type, url, callback, errCallback, data);
    },

    postReq(url, callback, errCallback, data) {
        const type = "POST";

        this.xhr(type, url, callback, errCallback, data);
    }
};

window.onload = () => {
    window.akari.page.load();
};

window.akari.updateUseNotification();