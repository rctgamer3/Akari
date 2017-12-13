(((akari, page) => {

    akari.page = akari.extend({}, page, {
        load() {

            document.getElementById("displayBtcQr").onclick = e => {
                e.preventDefault();
                document.getElementById("btcQr").className = "qr-code";
            };
        }
    });

}))(window.akari, window.akari.page);