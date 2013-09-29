M.wrap('github/IonicaBizau/bind-filter/dev/ui.js', function (require, module, exports) {
var find = require('./find');
var list = require('./list');
var inputs = require('./inputs');
var message = require('./message');
var loader = require('./loader');

// TODO use bind for dom interaction/manipulation
function elm(d,a){try{var b=document.createElement(d);if("object"===typeof a)for(var c in a)if (!a.hasOwnProperty(c)) return;b.setAttribute(c,a[c]);return b}catch(e){return null}}
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

    self.emit('showLoader');

    self.emit('setFilters', [filter]);

    var createKey = 'create';
    if (self.domRefs.controls[createKey]) {
        self.domRefs.controls[createKey].focus();
    }
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
    changeField.call(self, values.field, values.operator, typeof values.originalValue === 'string' ? values.originalValue : values.value, true);

    self.domRefs.filter.style.display = 'block';

    if (hash && self.filters[hash]) {
        self.domRefs.inputs.value.focus();
    } else {
        self.domRefs.inputs.field.focus();
    }
}

function remove (hash) {
    var self = this;

    self.emit('showLoader');
    self.emit('resetSkip');

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

    self.emit('showLoader');
    self.emit('resetSkip');

    // TODO remove class with bind
    self.filters[hash].item.setAttribute('class', '');
    self.filters[hash].disabled = false;

    find.call(self);
}

function disable (hash) {
    var self = this;

    self.emit('showLoader');
    self.emit('resetSkip');

    // TODO add class with bind
    self.filters[hash].item.setAttribute('class', 'disabled');
    self.filters[hash].disabled = true;

    find.call(self);
}

function changeField (field, operator, value, editMode) {
    var self = this;

    if (!field) {
        // field is set in the for loop
        for (field in self.templates[self.template].schema) {
            if (!self.templates[self.template].schema.hasOwnProperty(field)) return;

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
    inputs.value.call(self, field, operator, value, editMode);
    self.emit('filtersChanged');
}

function createTemplateSelectOption (template) {
    var option = elm('option', {value: template.id});
    option.innerHTML = template.name;
    return option;
}

function setFilters (filters, reset) {
    var self = this;

    // reset filters if reset is true
    if (reset && self.domRefs.list) {
        self.domRefs.list.innerHTML = '';
    }

    // filters to list
    for (var hash in filters) {
        if (!filters.hasOwnProperty(hash)) return;
        list.save.call(self, hash);
    }

    // hide filter form
    self.domRefs.filter.style.display = 'none';
}

function setTemplateOptions () {
    var self = this;

    if (self.domRefs.templateSelector) {

        var df = document.createDocumentFragment();

        for (var template in self.templates) {
            if (!self.templates.hasOwnProperty(template)) return;

            df.appendChild(createTemplateSelectOption(self.templates[template]));
        }

        self.domRefs.templateSelector.innerHTML = '';
        self.domRefs.templateSelector.appendChild(df);
    }
}

function setTemplateSelection (template) {
    var self = this;

    // set fields
    inputs.fields.call(self);

    // select a field
    //changeField.call(self);

    // add template to selection, it it not exists
    if (!self.templates[template.id] && self.domRefs.templateSelector) {
        self.domRefs.templateSelector.appendChild(createTemplateSelectOption(template));
    }

    // select template
    if (self.domRefs.templateSelector) {
        self.domRefs.templateSelector.value = template.id;
    }
}

function handleFindResult (err, data) {
    var self = this;
    self.emit('hideLoader');
}

function showLoader () {
    var self = this;
    self.emit('showLoader');
}

function ui () {
    var self = this;

    if (!self.config.ui.controls) {
        return self.emit('message', 'error', 'No controls configured.');
    }

    //create the operator order if it was not gven in the configuration
    if (!self.config.ui.operatorOrder) {
        self.config.ui.operatorOrder = [];
        for (var operator in self.config.operators) {
            if (!self.config.operators.hasOwnProperty(operator)) return;

            self.config.ui.operatorOrder.push(operator);
        }
    }

    // TODO check dom elements

    // get dom refs
    self.domRefs = {};
    self.domRefs.filter = get(self.config.ui.filter, self.dom);
    self.domRefs.valueLabel = get(self.config.ui.valueLabel, self.dom);
    self.domRefs.valueField = get(self.config.ui.valueField, self.dom);

    if (self.config.ui.templateSelector) {
        self.domRefs.templateSelector= get(self.config.ui.templateSelector, self.dom);
    }

    // list item
    var listItem = get(self.config.ui.listItem, self.dom);
    if (listItem) {
        self.domRefs.listItem = listItem.cloneNode();
        self.domRefs.listItemContent = listItem.innerHTML;
        self.domRefs.list = listItem.parentNode;
        self.domRefs.list.innerHTML = '';
    }

    self.domRefs.inputs = {};
    for (var name in self.config.ui.inputs) {
        if (!self.config.ui.inputs.hasOwnProperty(name)) return;

        self.domRefs.inputs[name] = get(self.config.ui.inputs[name], self.dom);
    }

    self.domRefs.controls = {};
    for (var name in self.config.ui.controls) {
        if (!self.config.ui.controls.hasOwnProperty(name)) return;

        self.domRefs.controls[name] = get(self.config.ui.controls[name], self.dom);
    }

    // init message
    if (self.config.message) {
        message.call(self);
    }

    // init loader
    loader.call(self);

    // listen to ui events
    self.on('saveFilter', save);
    self.on('createFilter', edit);
    self.on('editFilter', edit);
    self.on('enableFilter', enable);
    self.on('disableFilter', disable);
    self.on('removeFilter', remove);
    self.on('cancelFilter', cancel);
    self.on('fieldChange', changeField);

    // listen to alter inputs events
    self.on('templates', setTemplateOptions);
    self.on('template', setTemplateSelection);
    self.on('filtersCached', setFilters);

    // listen crud events
    self.on('getTemplates', showLoader);
    self.on('find', showLoader);
    self.on('result', handleFindResult);
    self.on('templateResult', handleFindResult);

    // add events to controls
    for (var handler in self.domRefs.controls) {
        if (!self.domRefs.controls.hasOwnProperty(handler)) return;

        var control = self.domRefs.controls[handler];
        if (control) {
            control.addEventListener(self.config.ui.events[handler] || 'click', (function (handler) {
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


return module; });
