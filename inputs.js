// TODO use bind for dom interaction/manipulation
function elm(d,a){try{var b=document.createElement(d);if("object"===typeof a)for(var c in a)b.setAttribute(c,a[c]);return b}catch(e){return null}}

var getFieldLabel = require('./validate').getFieldLabel;

function fields () {
    var self = this;
    var fields = self.templates[self.template].schema;

    var df = document.createDocumentFragment();
    var locale = M.getLocale();
    for (var field in fields) {
        if (field.indexOf('_') !== 0 && !fields[field].noSearch) {
            var option = elm('option', {value: field});
            option.innerHTML = getFieldLabel.call(self, field, locale);
            df.appendChild(option);
        }
    }

    if (self.domRefs.inputs.field) {
        self.domRefs.inputs.field.innerHTML = '';
        self.domRefs.inputs.field.appendChild(df);
    }
}

function checkOperator (fieldTemplate, operator) {
    var self = this;
    
    if (self.config.operators[operator][1] === 'mixed' || (self.config.operators[operator][1].indexOf(fieldTemplate) > -1)) {
        return true;
    }
}

function value (field, operator, value) {
    var self = this;
    
    if (!self.template || !self.templates[self.template].schema[field] || !self.templates[self.template].schema[field].type) {
        return;
    }
    
    var fieldTemplate = self.config.operators[(operator || '=')][2] || self.templates[self.template].schema[field].type;
    var input;
    
    // refresh operators when changing the field
    if (!operator) {
        var df = document.createDocumentFragment();
        for (var op in self.config.operators) {
            if (checkOperator.call(self, fieldTemplate, op)) {
                var option = elm('option', {value: op});
                option.innerHTML = self.config.i18n ? (self.config.i18n[op] || op) : op;
                if (op === operator) {
                    option.setAttribute('selected', true);
                }
                df.appendChild(option);
            }
        }
        
        if (self.domRefs.inputs.operator) {
            self.domRefs.inputs.operator.innerHTML = '';
            self.domRefs.inputs.operator.appendChild(df);
        }
    }

    // handle boolean input
    if (fieldTemplate === 'boolean') {
        var select = elm('select', {name: 'value'});
        var opt1 = elm('option', {value: 'true'});
        opt1.innerHTML = 'true';

        var opt2 = elm('option', {value: 'false'});
        opt2.innerHTML = 'false';

        select.appendChild(opt1);
        select.appendChild(opt2);
        select.value = value;
        input = select;

    // handle array input
    } else if (fieldTemplate === 'array') {
        var array = elm('input', {name: 'value', type: 'text', value: value || ''});
        // TODO implement tag input plugin here...
        /*array.addEventListener('keyup', function (event) {
            if (event.keyCode === 13) {
                console.log(array.value);
            }
        });*/
        input = array;

    // handle number and text input
    } else if (fieldTemplate === 'number') {
        input = elm('input', {name: 'value', type: 'number', value: value || '', step: 'any'});
    } else {
        input = elm('input', {name: 'value', type: 'text', value: value || ''});
    }

    self.domRefs.inputs.value = input;

    // emit a saveFilter when pressing Enter while focused on this input
    self.domRefs.inputs.value.addEventListener('keyup', function(event) {
        if (event.keyCode === 13) {
            self.emit('saveFilter');
            self.domRefs.inputs.value.blur();
        }

        if(event.keyCode === 27) {
            self.emit('cancelFilter');
            self.domRefs.inputs.value.blur();
        }
    });

    if (self.domRefs.valueField) {
        self.domRefs.valueField.innerHTML = '';
        self.domRefs.valueField.appendChild(input);
    }
}

exports.value = value;
exports.fields = fields;