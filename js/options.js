(((akari, page, storage) => {
    akari.page = akari.extend({}, page, {
        load() {
            this.updateInputs();
            this.setupEvents();
        },

        setupEvents() {
            const that = this;
            const saveBtn = document.getElementById("save");
            const playSound = document.getElementById("playSound");
            const soundEffectVolume = document.getElementById("soundEffectVolume");

            // sound effects
            soundEffectVolume.onchange = this.saveSoundEffectVolume;
            soundEffectVolume.value = storage.get("settings.soundEffectVolume");

            // use akar.in domain
            const akarinLinksInfoLink = document.getElementById("akarinLinksInfoLink");
            const akarinLinksInfo = document.getElementById("akarinLinksInfo");

            // private links
            const privateLinksInfoLink = document.getElementById("privateLinksInfoLink");
            const privateLinksInfo = document.getElementById("privateLinksInfo");

            // use notification on hairbun click
            const useNotificationInfoLink = document.getElementById("useNotificationInfoLink");
            const useNotificationInfo = document.getElementById("useNotificationInfo");
            const useNotificationCheckbox = document.getElementById("useNotification");

            useNotificationCheckbox.onchange = function() {
                if (this.checked) {
                    akari.displayNotification("Sample notification. This will display when you click the hairbun icon.")
                }
            };

            playSound.onclick = akari.playSoundEffect;
            saveBtn.onclick = this.saveSettings.bind(this);

            akarinLinksInfoLink.onclick = e => {
                e.preventDefault();
                that.showInfobox(akarinLinksInfo);
            };

            privateLinksInfoLink.onclick = e => {
                e.preventDefault();
                that.showInfobox(privateLinksInfo);
            };

            useNotificationInfoLink.onclick = e => {
                e.preventDefault();
                that.showInfobox(useNotificationInfo);
            };
        },

        showInfobox(element) {
            if (element.style.opacity >= 1) {
                return;
            }

            this.fadeInElement(element);
        },

        updateInputs() {
            const playSoundEffectInput = document.getElementById("playSoundEffect");
            const apiKeyInput = document.getElementById("apiKey");
            const soundEffectVolumeInput = document.getElementById("soundEffectVolume");
            const akarinLinksInput = document.getElementById("akarinLinks");
            const privateLinksInput = document.getElementById("privateLinks");
            const notificationLongUrl = document.getElementById("notificationLongUrl");
            const notificationRandomImage = document.getElementById("notificationRandomImage");
            const useNotification = document.getElementById("useNotification");

            const apiKey = storage.get("settings.apiKey");

            if (apiKey) {
                apiKeyInput.value = btoa(apiKey);
            }

            privateLinksInput.checked = storage.get("settings.privateLinks");
            akarinLinksInput.checked = storage.get("settings.akarinLinks");

            notificationLongUrl.checked = storage.get("settings.notificationLongUrl");
            notificationRandomImage.checked = storage.get("settings.notificationRandomImage");
            useNotification.checked = storage.get("settings.useNotification");

            playSoundEffectInput.checked = storage.get("settings.playSoundEffect");
            soundEffectVolumeInput.value = storage.get("settings.soundEffectVolume");
        },

        doSaveSettings() {
            let apiKey = document.getElementById("apiKey").value;
            const akarinLinks = document.getElementById("akarinLinks").checked;
            const privateLinks = document.getElementById("privateLinks").checked;
            const playSoundEffect = document.getElementById("playSoundEffect").checked;
            const notificationLongUrl = document.getElementById("notificationLongUrl").checked;
            const notificationRandomImage = document.getElementById("notificationRandomImage").checked;
            const useNotification = document.getElementById("useNotification").checked;
            const select = document.getElementById("soundEffectVolume");
            const volume = select.options[select.selectedIndex].value;
            const pattern = new RegExp("[A-Za-z0-9]");
            const currentuseNotificationSetting = akari.storage.get("settings.useNotification");

            if (pattern.test(apiKey) || apiKey === "") {
                apiKey = atob(apiKey);
            } else {
                apiKey = "";
            }

            const settings = {
                apiKey,
                akarinLinks,
                privateLinks,
                playSoundEffect,
                soundEffectVolume: volume,
                notificationLongUrl,
                notificationRandomImage,
                useNotification
            };

            storage.setSettings(settings);

            if (useNotification !== currentuseNotificationSetting) {
                akari.updateUseNotification();

                if (useNotification) {
                    // Create test notification
                    akari.displayNotification("Test notification.");
                }

                // Extension needs to be reloaded when this setting is changed...
                // TODO -- There's got to be a better way...
                chrome.runtime.reload();
            }
        },

        saveSoundEffectVolume(e) {
            storage.set("settings.soundEffectVolume", e.target.value);
        },

        saveSettings() {
            this.doSaveSettings();
            this.displaySavedAlert();
        },

        displaySavedAlert() {
            const that = this;
            const savedMessageAlert = document.getElementById("result");

            document.getElementById("message").textContent = "Settings saved";

            savedMessageAlert.style.display = "block";
            savedMessageAlert.style.opacity = 1;

            const wait = setInterval(() => {
                that.fadeOutElement(savedMessageAlert);
                clearInterval(wait);
            }, 2000);
        },

        /**
         * http://stackoverflow.com/a/6121270
         * @param element
         */
        fadeOutElement: function fade(element) {
            let op = 1; // initial opacity

            const timer = setInterval(() => {
                if (op <= 0.1) {
                    clearInterval(timer);
                    element.style.display = 'none'
                    element.style.opacity = "0";
                }

                element.style.opacity = op;
                op -= op * 0.1
            }, 50);
        },

        /**
         * http://stackoverflow.com/a/6121270
         * @param element
         */
        fadeInElement: function unfade(element) {
            let op = 0.1; // initial opacity

            element.style.display = 'block';

            const timer = setInterval(() => {
                if (op >= 1) {
                    clearInterval(timer);
                }

                element.style.opacity = op;
                op += op * 0.1;
            }, 10);
        }

    });
}))(window.akari, window.akari.page, window.akari.storage);