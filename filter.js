M.wrap('github/jillix/bind-filter/dev/filter.js', function (require, module, exports) {
var Events = require('github/jillix/events');
var find = require('./find');
var ui = require('./ui');
var validate = require('./validate');
var templateCache = {};
var defaultOptions = {
    limit: 33
};
var operatorConfig = {
    '=':        ['',        'mixed'],               // or
    '!=':       ['$ne',     'mixed'],               // and
    '>':        ['$gt',     'number'],              // and
    '<':        ['$lt',     'number'],              // and
    '>=':       ['$gte',    'number'],              // and
    '<=':       ['$lte',    'number'],              // and
    'all':      ['$all',    'array',    'split'],   // or ('and' can be achieved by concatenating the arrays)
    'in':       ['$in',     'mixed',    'split'],   // and ('or' can be achieved by concatenating the arrays)
    'notin':    ['$nin',    'mixed',    'split'],   // or ('and' can be achieved by concatenating the arrays)
    'regExp':   ['$regex',  'string'],              // and ('or' is built in the regex syntax)
    'exists':   ['$exists', 'mixed',    'boolean']  // makes no sense
};

function MergeRecursive(obj1, obj2) {

    for (var p in obj2) {
        try {
            // Property in destination object set; update its value.
            if (obj2[p].constructor == Object) {
                obj1[p] = MergeRecursive(obj1[p], obj2[p]);
            } else {
                obj1[p] = obj2[p];
            }
        } catch(e) {
            // Property in destination object not set; create it and set its value.
            obj1[p] = obj2[p];
        }
    }

    return obj1;
}

function uid (len, uid) {
    uid = "";
    for (var i = 0, l = len || 24; i < l; ++i) {
        uid += "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"[0 | Math.random() * 62];
    }
    return uid;
};

function setFilters (filters, reset) {
    var self = this;
    
    // reset filters if reset is true
    if (reset) {
        self.filters = {};
    }
    
    if (!filters || typeof filters !== "object") { return; }

    // create and buffer filters
    for (var i = 0, l = filters.length; i < l; ++i) {
    
        // validate field
        if (validate.validate.call(self, filters[i])) {
            
            // convert value from value field
            filters[i] = validate.convert.call(self, filters[i]);
            
            var hash = filters[i].hash || uid(4);
            self.filters[hash] = self.filters[hash] || {};
            
            // merge filter
            for (var key in filters[i]) {
                self.filters[hash][key] = filters[i][key];
            }
        }
    }
    
    // emit filters cahed event
    self.emit('filtersCached', self.filters, reset);
    
    // find data in db
    find.call(self);
}

function getTemplates (templates, reset, callback) {
    var self = this;

    // get templates to fetch from server
    self.emit('getTemplates', templates, function (err, templates) {

        self.emit('templateResult', err, templates);
        
        if (err) {
            return callback(err);
        }
        
        // merge fetched templates into result templates
        for (var template in templates) {
           self.templates[template] = templates[template];
        }
        
        // reset cache
        if (reset) {
            self.templates = templates;
        }
        
        callback(null);
    });
}

function setTemplates (templates, callback) {
    var self = this;

    if (templates instanceof Array) {
        getTemplates.call(self, templates, true, function (err) {
            if (err) {
                // TODO handle error
                return console.error(err);
            }
            
            // select a template
            if (!self.template) {
                for (template in self.templates) {
                    self.template = template;
                    self.emit('template', self.templates[template]);
                    break;
                }
            }
            
            if (callback) {
                callback();
            }
            
            // emit the templates
            self.emit('templates', self.templates);
        });
    }
}

function setTemplate (template, callback) {
    var self = this;

    // TODO this is a hack until bind know how select keys in parameters
    if (typeof template === 'object') {
        template = template._id;
    }

    if (typeof template !== 'string' || !template) {
        return;
    }

    // get template from server or cache
    getTemplates.call(self, [template], false, function (err) {
        
        if (err) {
            // TODO handle error
            return console.error(err);
        }
        
        // set current template
        self.template = template;
        
        // set sort options
        if (template.sort) {
            self.emit("setOptions", {sort: template.sort});
        }
        
        setFilters.call(self, (self.config.setFilters || []).concat(self.templates[template].filters || []), true);
        
        // emit the template
        self.emit('template', self.templates[template]);
    });
}

function setOptions (options, reset, callFind) {
    var self = this;

    if (typeof options !== 'object') {
        return;
    }

    // reset options
    if (reset) {
        self.options = options;
    // merge options
    } else {
        for (var option in options) {
            var value = options[option];
            
            // option is an array
            //var optionValue = self.options[option];

            // TODO How do we merge objects?
            // switch ((optionValue || {}).constructor) {
            //     case Array:
            //         optionValue.push(value);
            //         break;
            //     case Object:
            //         switch (value.constructor) {
            //             case Object:
            //                 optionValue = MergeRecursive(self.options[option], value);
            //                 break;
            //             default:
            //                 optionValue = value;
            //                 break;
            //         }
            //         break;
            //     default:
            //         optionValue = value;
            // }

            self.options[option] = value;

        }
    }

    // emit options cahed event
    self.emit('optionsCached', self.options, reset);
    
    // find data in db
    if (callFind) {
        find.call(self);
    }
}

function getFilters (callback) {
    var self = this;
    var filters = [];
    for (var id in self.filters) {
        var filter = self.filters[id];
        filter.item = null;
        filters.push(filter);
    }
    callback(filters);
}

function getItem (dataItem, callback) {
    var self = this;

    if (!self.query) { return; }

    if (self.crudFindBusy) {
        return callback('Find is busy.');
    }

    self.crudFindBusy = true;
    self.emit('find', self.query, function (err, data) {
        self.crudFindBusy = false;

        for (var i = 0, l = data.length; i < l; ++i) {
            if (data[i]._id === dataItem._id) {
                data[i].bindFilterMessage = 'show';
                return callback(null, data[i]);
            }
        }
        
        // TODO How must this look?
        callback(null, {_id: dataItem._id, bindFilterMessage: 'hide'});
    });
}

function initInterface () {
    var self = this;
    
    // listen to interface events
    self.on('setFilters', setFilters);
    self.on('setTemplate', setTemplate);
    self.on('setTemplates', setTemplates);
    self.on('setOptions', setOptions);
    self.on('getFilters', getFilters);
    self.on('getItem', getItem);
}

function init (config) {

    var self = this;
    
    // prepare module
    self.config = config;
    self.filters = {};
    self.templates = templateCache;
    
    // TODO merge options
    self.options = config.options || defaultOptions;
    self.config.operators = operatorConfig;
    
    if (!config.waitFor) {
        return console.error('At least a CRUD mofule must be a dependency of the bind-filter module.');
    }
        
    // setup interface
    initInterface.call(self);
    
    // listen to external events
    Events.call(self, config);

    // i18n for operators
    if (self.config.i18n === true) {

        // cache for translated operators
        self.config.i18n = {};

        var operators = self.config.operators;
        for (var operator in operators) {
            (function (op) {
                self.emit("message", op, function (err, newOperator) {
                    if (err) { return; }
                    // cache the translated operator
                    self.config.i18n[op] = newOperator.message;;
                });
            })(operator);
        }
    }

    if (self.config.ui) {
        ui.call(self);
    }
    
    // init templates
    if (self.config.setTemplates) {
        self.emit('setTemplates', self.config.setTemplates, function () {
            // init template
            if (self.config.template) {
                self.emit('setTemplate', self.config.template);
            }
        });
    // init template
    } else if (self.config.template) {
        self.emit('setTemplate', self.config.template);
    }
    
    self.emit('ready');
}

module.exports = init;


return module; });
