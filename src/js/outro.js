 if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
        define(function () {
            return Lottery;
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = Lottery;
    } else {
        window.Lottery = Lottery;
    }
})();