M.wrap('github/jillix/bind-filter/dev/controls.js', function (require, module, exports) {
var list = require('./list');
var find = require('./find');
var operators = require('./operators');

function uid (len, uid) {
    uid = "";
    for (var i = 0, l = len || 24; i < l; ++i) {
        uid += "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"[0 | Math.random() * 62];
    }
    return uid;
};


function getValues () {
    var self = this;
    
    return {
        field: self.domRefs.inputs.field.value,
        operator: self.domRefs.inputs.operator.value || '=',
        value: self.domRefs.inputs.value.value
    };
}

function resetValues (values) {
    var self = this;
    
    if (values.field) {
        self.domRefs.inputs.field.value = values.field;
        self.domRefs.inputs.operator.value = values.operator;
        
        if (self.domRefs.inputs.value) {
            self.domRefs.inputs.value.value = values.value;
        }
    } else {
        self.domRefs.inputs.field.options[0].selected = true;
        self.domRefs.inputs.operator.options[0].selected = true;
        
        if (self.domRefs.inputs.value) {
            self.domRefs.inputs.value.value = '';
        }
    }
}

function handleFindResult (err, data) {
    console.log(err || data);
}

function checkField (field) {
    var self = this;
    
    for (var i = 0, l = self.config.fields.length; i < l; ++i) {
        if (field === self.config.fields[i]) {
            return true;
        }
    }
    return false;
}

function setFilters (filters, enabled) {
    var self = this;
    
    for (var i = 0, l = filters.length; i < l; ++i) {
    
        // skip fields that don't exists in schema
        if (!checkField.call(self, filters[i].field)) {
            continue;
        }
        
        var hash = uid(4);
        
        self.filters[hash] = {
            values: filters[i],
            enabled: enabled ? true : false
        };
        
        list.save.call(self, hash);
    }
    
    find.call(self);
}

function save () {
    var self = this;
    
    self.domRefs.filter.style.display = 'none';
    
    // get or create filter hash
    var hash = self.current || uid(4);
    
    self.filters[hash] = self.filters[hash] || {};
    self.filters[hash].values = getValues.call(self);
    self.filters[hash].enabled = true;
    
    // add list item
    list.save.call(self, hash);
    
    // call server
    find.call(self);
}

function edit (hash) {
    var self = this;
    var values = hash ? self.filters[hash].values : {};
    self.current = hash || null;
    
    // handle remove button
    if (hash && self.filters[hash]) {
        self.domRefs.controls.remove.style.display = 'inline';
    } else {
        self.domRefs.controls.remove.style.display = 'none';
    }
    
    // operator init
    resetValues.call(self, values);
    
    // change value field dependent of selected operator
    value.call(self, self.domRefs.inputs.operator.value, values.value || '');
    
    self.domRefs.filter.style.display = 'block';
}

function remove (hash) {
    var self = this;
    
    self.domRefs.filter.style.display = 'none';
    list.remove.call(self, hash || self.current);
    
    find.call(self);
}

function cancel () {
    var self = this;
    self.current = null;
    self.domRefs.filter.style.display = 'none';
}

function enable (hash) {
    var self = this;
    // TODO remove class with bind
    self.filters[hash].item.setAttribute('class', '');
    self.filters[hash].enabled = true;
    
    find.call(self);
}

function disable (hash) {
    var self = this;
    // TODO add class with bind
    self.filters[hash].item.setAttribute('class', 'disabled');
    self.filters[hash].enabled = false;
    
    find.call(self);
}

function value (operator, value) {
    var self = this;
    var valueField = operators.value.call(self, operator, value);
    
    self.domRefs.inputs.value = valueField || {value: ''};
    self.domRefs.valueField.innerHTML = '';
    
    if (valueField && operator) {
        self.domRefs.valueLabel.style.display = 'block';
        self.domRefs.valueField.appendChild(valueField);
    } else {
        self.domRefs.valueLabel.style.display = 'none';
    }
}

function init () {
    var self = this;
    
    // listen
    self.on('result', handleFindResult);
    self.on('setFilters', setFilters);
    self.on('saveFilter', save);
    self.on('createFilter', edit);
    self.on('editFilter', edit);
    self.on('enableFilter', enable);
    self.on('disableFilter', disable);
    self.on('removeFilter', remove);
    self.on('cancelFilter', cancel);
    self.on('operatorChange', value);
    
    // add events to controls
    for (var handler in self.domRefs.controls) {
        self.domRefs.controls[handler].addEventListener(self.config.events[handler] || 'click', (function (handler) {
            return function () {
                self.emit(handler + 'Filter');
            }
        })(handler));
    }
    
    // operator change
    self.domRefs.inputs.operator.addEventListener('change', function () {
        self.emit('operatorChange', self.domRefs.inputs.operator.value);
    });
    
    // set predefined filters
    if (self.config.setFilters) {
        setFilters.call(self, self.config.setFilters, self.config.enabled);
    }
}

exports.init = init;

return module; });