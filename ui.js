var list = require('./list');
var inputs = require('./inputs');

// TODO use bind for dom interaction/manipulation
function elm(d,a){try{var b=document.createElement(d);if("object"===typeof a)for(var c in a)b.setAttribute(c,a[c]);return b}catch(e){return null}}
function get(s,c){
    try{return (c||document).querySelector(s);}
    catch (err) {
        return null;
    }
}

function save () {
    var self = this;
    var filter = {
        field: self.domRefs.inputs.field.value,
        operator: self.domRefs.inputs.operator.value || '=',
        value: self.domRefs.inputs.value.value,
        hash: self.current
    };
    
    setFilters.call(self, [filter]);
}

function edit (hash) {
    var self = this;
    var values = hash ? self.filters[hash] : {};

    self.current = hash || null;

    // handle remove button
    if (hash && self.filters[hash]) {
        self.domRefs.controls.remove.style.display = 'inline';
    } else {
        self.domRefs.controls.remove.style.display = 'none';
    }

    // change value field and operator selection dependent of selected field
    changeField.call(self, values.field, values.operator, values.value);

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
    self.filters[hash].disabled = false;

    find.call(self);
}

function disable (hash) {
    var self = this;
    // TODO add class with bind
    self.filters[hash].item.setAttribute('class', 'disabled');
    self.filters[hash].disabled = true;

    find.call(self);
}

function changeField (field, operator, value) {
    var self = this;

    if (!field) {
        for (field in self.templates[self.template]) {
            if (field.indexOf('_') !== 0) {
                break;
            }
        }
    }

    // select field if it exists in the schema
    if (self.domRefs.inputs.field) {
        self.domRefs.inputs.field.value = field;
    }

    // set operators which are compatible with the field template
    // and create value field depending on schema and operator
    inputs.value.call(self, field, operator, value);
}

function createTemplateSelectOption (template) {
    var option = elm('option', {value: template});
    option.innerHTML = template;
    return option;
}

function handleFindResult (err, data) {
    //console.log(err || data.length + " items found.");
}

function ui () {
    var self = this;

    if (!self.config.ui.controls) {
        return console.error('No controls found.');
    }

    // get dom refs
    self.domRefs = {};
    self.domRefs.filter = get(self.config.filter, self.dom);
    self.domRefs.valueLabel = get(self.config.valueLabel, self.dom);
    self.domRefs.valueField = get(self.config.valueField, self.dom);

    if (self.config.templateSelector) {
        self.domRefs.templateSelector= get(self.config.templateSelector, self.dom);
    }

    // list item
    self.domRefs.list = get(self.config.list, self.dom);
    self.domRefs.listItem = get(self.config.listItem, self.domRefs.list);

    if (self.domRefs.list) {
        self.domRefs.list.innerHTML = '';
    }

    self.domRefs.inputs = {};
    for (var name in self.config.inputs) {
        self.domRefs.inputs[name] = get(self.config.inputs[name], self.dom);
    }

    self.domRefs.controls = {};
    for (var name in self.config.controls) {
        self.domRefs.controls[name] = get(self.config.controls[name], self.dom);
    }
    
    // listen to ui events
    self.on('saveFilter', save);
    self.on('createFilter', edit);
    self.on('editFilter', edit);
    self.on('enableFilter', enable);
    self.on('disableFilter', disable);
    self.on('removeFilter', remove);
    self.on('cancelFilter', cancel);
    self.on('fieldChange', changeField);
    self.on('result', handleFindResult);
    
    // add events to controls
    for (var handler in self.domRefs.controls) {

        var control = self.domRefs.controls[handler];
        if (control) {
            control.addEventListener(self.config.events[handler] || 'click', (function (handler) {
                return function () {
                    self.emit(handler + 'Filter');
                }
            })(handler));
        }
    }

    // template change
    if (self.domRefs.templateSelector) {
        self.domRefs.templateSelector.addEventListener('change', function () {
            self.emit('setTemplate', self.domRefs.templateSelector.value);
        });
    }

    // field change
    if (self.domRefs.inputs.field) {
        self.domRefs.inputs.field.addEventListener('change', function () {
            self.emit('fieldChange', self.domRefs.inputs.field.value);
        });
    }

    // operator change
    if (self.domRefs.inputs.operator) {
        self.domRefs.inputs.operator.addEventListener('change', function () {
            self.emit('fieldChange', self.domRefs.inputs.field.value, self.domRefs.inputs.operator.value);
        });
    }
}

module.exports = ui;
