(((akari, page, storage, chrome) => {
    akari.page = akari.extend({}, page, {
        load() {
            this.setupContextMenu();
        },

        setupContextMenu() {
            this.createContextMenuItem(
                "Akarin~ Shorten Current Page",
                ["page"],
                "pageUrl"
            );
            this.createContextMenuItem(
                "Akarin~ Shorten Link URL",
                ["link"],
                "linkUrl"
            );

            this.createContextMenuItem(
                "Akarin~ Shorten Image URL",
                ["image"],
                "srcUrl"
            );
        },

        showResult(result) {
            const element = document.getElementById("url");

            if (result.success === true) {
                akari.copyToClipboard(element, result.link);
                akari.displayNotification(result);

                if (akari.shouldPlaySoundEffect()) {
                    akari.playSoundEffect();
                }
            } else {
                akari.copyToClipboard(element, result.error);
                akari.displayNotification(result.error);
            }
        },

        /**
         * @param title [string]
         * @param contexts [array]
         * @param urlKey [string]
         */
        createContextMenuItem(title, contexts, urlKey) {
            const that = this;

            browser.contextMenus.create({
                title,
                contexts,
                onclick(info, tab) {
                    akari.shortenUrl(info[urlKey], that.showResult.bind(that));
                }
            });
        }
    });
}))(window.akari, window.akari.page, window.akari.storage, chrome);