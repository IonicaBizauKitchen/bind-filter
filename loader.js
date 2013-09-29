M.wrap('github/IonicaBizau/bind-filter/dev/loader.js', function (require, module, exports) {
// TODO use bind for dom interaction/manipulation
function get(s,c){try{return (c||document).querySelectorAll(s);}catch (err) {return [null];}}

function handleInputs(disable) {
    var self = this;
    // TODO disable inputs while loading
}

function hideShowFilters (hide) {
    var self = this;

    for (var i = 0, l = self.loader.hide.length; i < l; ++i) {
        self.loader.hide[i].style.display = hide ? 'none' : 'block';
    }
}

function show () {
    var self = this;

    // hide filter
    hideShowFilters.call(self, true);
    // disable inputs
    handleInputs.call(self, true);
    // show loader
    self.loader.loader.style.display = 'block';
}

function hide () {
    var self = this;

    // hide loader
    self.loader.loader.style.display = 'none';
    // enable inputs
    handleInputs.call(self);
    // show filter
    hideShowFilters.call(self);
}

function init () {
    var self = this;

    if (!self.config.ui.loader) {
        return;
    }

    self.loader = {
        loader: get(self.config.ui.loader.loader, self.dom)[0],
        hide: get(self.config.ui.loader.hide, self.dom)
    };

    self.on('showLoader', show);
    self.on('hideLoader', hide);
}

module.exports = init;


return module; });
