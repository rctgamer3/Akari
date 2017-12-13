(((akari, page, storage) => {

    akari.page = akari.extend({}, page, {
        load() {
            const apiKey = storage.get("settings.apiKey");
            const loadMoreBtn = document.getElementById("loadMore");

            this.isLoggedIn = typeof apiKey === "string" && apiKey.length !== 0;
            this.fromHistoryCount = 0;
            this.historyToCount = 25;

            const accountHistoryLoading = document.getElementById("accountHistoryLoading");
            const nonAccountHistoryMessage = document.getElementById("nonAccountHistoryMessage");

            if (this.isLoggedIn) {
                accountHistoryLoading.classList.remove("hide");
                this.setupAccountHistory();
            } else {
                nonAccountHistoryMessage.classList.remove("hide");
                this.setupHistory();
            }

            loadMoreBtn.onclick = this.loadMoreHistory.bind(this);
        },

        clearHistory() {
            const message = document.getElementById("message");
            const history = document.getElementById("history");

            storage.remove("history");

            this.hideClearBtn();

            message.innerHTML = "Local history cleared";
            history.innerHTML = "";
            history.className = "hidden";
        },

        hasHistory() {
            return !!storage.get("history");
        },

        getClearBtn() {
            return document.querySelectorAll(".clear-btn");
        },

        hideClearBtn() {
            const clearBtn = this.getClearBtn();

            for (let i = 0; i < clearBtn.length; i++) {
                clearBtn[i].className = "hidden clear-btn";
            }
        },

        setupClearBtnEvents() {
            const clearBtn = this.getClearBtn();
            const that = this;

            for (let i = 0; i < clearBtn.length; i++) {
                clearBtn[i].addEventListener("click", () => {
                    that.clearHistory();
                }, false);

                clearBtn[i].className = "btn btn-danger btn-xs clear-btn";
            }
        },

        setupHistory() {
            let history, key, historyArray = [];

            if (!this.hasHistory()) {
                document.getElementById("message").innerHTML = "Nothing here. Go shorten some links.";
                return;
            }

            this.setupClearBtnEvents();

            history = storage.get("history");

            for (key in history) {
                if (history.hasOwnProperty(key)) {
                    historyArray.push(history[key]);
                }
            }

            historyArray.sort((a, b) => a.timestamp > b.timestamp ? -1 : a.timestamp < b.timestamp ? 1 : 0);

            this.buildHistory(historyArray);
        },

        loadMoreHistory(e) {
            const loadMoreBtn = document.getElementById("loadMore");
            const accountHistoryLoading = document.getElementById("accountHistoryLoading");

            e.preventDefault();

            accountHistoryLoading.classList.add("hide");
            loadMoreBtn.textContent = "Loading...";

            const callback = () => {
                loadMoreBtn.textContent = "Load More";
            };

            this.setupAccountHistory(callback);
        },

        setupAccountHistory(callback) {
            const from = this.fromHistoryCount;
            const to = this.historyToCount;
            const that = this;
            const loadingHistoryElement = document.getElementById("accountHistoryLoading");
            const urlHistory = "https://api.waa.ai/user-history";
            const data = {
                apiKey: btoa(storage.get("settings.apiKey")),
                from,
                to
            };

            const successResponse = response => {
                if (response.length === 0) {
                    loadingHistoryElement.textContent = "Nothing here. Go shorten some links.";;
                    return;
                }

                const loadMoreHistoryContainer = document.getElementById("loadMoreHistoryContainer");
                const loadMoreBtn = document.getElementById("loadMore");

                loadingHistoryElement.classList.add("hide");
                that.buildHistory(response);

                loadMoreHistoryContainer.classList.remove("hide");
                that.historyToCount = that.historyToCount + 25;
                that.fromHistoryCount = that.fromHistoryCount + 25;
                loadMoreBtn.setAttribute("data-from", "0");
                loadMoreBtn.setAttribute("data-to", that.historyToCount);

                if (callback && typeof callback === "function") {
                    callback();
                }
            };

            const errorResponse = response => {
                loadingHistoryElement.classList.add("alert", "alert-danger", "alert-sm");
                loadingHistoryElement.textContent = response.error;
            };

            akari.xhr.postReq(urlHistory, successResponse, errorResponse, data);
        },

        buildHistory(historyArray) {
            let urlObj, shortCode, shortUrl, longUrl, statsUrl, deleteUrl, extension, dateAdded, privateCode, link;
            let domain = "waa.ai/";
            let statsLink = "https://stats.waa.ai/";

            if (storage.get("storage.useAkariinDomain") === true) {
                domain = "https://akari.in/";
            }

            // DOM elements
            let aLink, clicks, small, liShortUrl, ulLongUrl, liLongUrl;
            const ul = document.getElementById("history");

            for (let i = 0; i < historyArray.length; i++) {
                urlObj = historyArray[i];

                shortCode = urlObj["shortCode"];
                shortUrl = urlObj["shortUrl"];
                statsUrl = urlObj["statsUrl"];
                longUrl = urlObj["longUrl"];
                deleteUrl = urlObj["deleteUrl"];
                privateCode = urlObj["privateCode"];
                extension = urlObj["extension"];

                link = domain + shortCode;
                statsLink += shortCode;

                if (privateCode) {
                    link += `/${privateCode}`;
                    statsLink += `/${privateCode}`;
                }

                if (extension) {
                    link += extension;
                }

                if (urlObj["timestamp"]) {
                    dateAdded = new Date(urlObj["timestamp"]).toString().split(" ");
                    dateAdded = `${dateAdded[1]} ${dateAdded[2]} ${dateAdded[3]}`;
                } else if (urlObj["dateAdded"]) {
                    dateAdded = urlObj["dateAdded"];
                } else {
                    dateAdded = "";
                }

                // Painstakingly create elements and add to DOM
                aLink = document.createElement("a");
                aLink.textContent = link;
                aLink.setAttribute("href", shortUrl);
                aLink.setAttribute("target", "_blank");
                clicks = document.createElement("small");

                if (this.isLoggedIn) {
                    clicks.textContent = `${urlObj["clicks"]} clicks`;
                } else {
                    clicks.innerHTML = `&mdash; <a target="_blank" href="${statsLink}">statistics</a> &#xFF0F; <a target="_blank" href="${deleteUrl}">delete</a>`;
                }

                small = document.createElement("small");
                small.style["word-break"] = "break-all";
                small.innerHTML = `${dateAdded}<br>${longUrl}`;

                liShortUrl = document.createElement("li");
                ulLongUrl = document.createElement("ul");
                liLongUrl = document.createElement("li");

                liShortUrl.appendChild(aLink);
                liShortUrl.appendChild(document.createTextNode("\u00A0\u00A0"));
                liShortUrl.appendChild(clicks);
                liShortUrl.appendChild(ulLongUrl);
                ulLongUrl.appendChild(liLongUrl);
                liLongUrl.appendChild(small);
                ul.appendChild(liShortUrl);
            }
        }
    });

}))(window.akari, window.akari.page, window.akari.storage);