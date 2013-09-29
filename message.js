M.wrap('github/IonicaBizau/bind-filter/dev/message.js', function (require, module, exports) {
// TODO use bind for dom interaction/manipulation
function get(s,c){
    try{return (c||document).querySelector(s);}
    catch (err) {
        return null;
    }
}

function handleMessage (type, msg) {
    var self = this;

    // set bootstrap alert classes
    switch (type) {
        case 'error':
            // TODO handle attributes with bind
            self.domRefs.message.container.setAttribute('class', 'message alert alert-danger hideOnLoad');
            break;
        case 'success':
            self.domRefs.message.container.setAttribute('class', 'message alert alert-success hideOnLoad');
            break;
        case 'info':
            self.domRefs.message.container.setAttribute('class', 'message alert alert-info hideOnLoad');
            break;
        default:
            self.domRefs.message.container.setAttribute('class', 'message alert hideOnLoad');
            break;
    }

    self.domRefs.message.text.innerHTML = msg;
}

function init () {
    var self = this;

    // check if message config exists
    if (!self.config.message) {
        return;
    }

    // configure
    self.domRefs.message = {
        container: get(self.config.message.container, self.dom),
        text: get(self.config.message.text, self.dom)
    };

    if (!self.domRefs.message.container || !self.domRefs.message.container) {
        return;
    }

    // listen
    self.on('message', handleMessage);
}

module.exports = init;


return module; });
