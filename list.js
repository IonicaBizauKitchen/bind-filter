M.wrap('github/IonicaBizau/bind-filter/dev/list.js', function (require, module, exports) {
// TODO use bind for dom interaction/manipulation
function get(s,c){
    try{return (c||document).querySelector(s);}
    catch (err) {}
}

function buildItem (elem, content) {
    var elem = elem.cloneNode();
    elem.innerHTML = content;
    return elem;
}

var getFieldLabel = require('./validate').getFieldLabel;

function createFilterItem (hash) {
    var self = this;

    var item = buildItem(self.domRefs.listItem, self.domRefs.listItemContent);

    var checkbox = get(self.config.ui.item.onoff, item);
    var field = get(self.config.ui.item.field, item);
    var operator = get(self.config.ui.item.operator, item);
    var value = get(self.config.ui.item.value, item);
    var edit = get(self.config.ui.item.edit, item);
    var rm = get(self.config.ui.item.remove, item);

    // enable/disable filter
    if (self.filters[hash].disabled) {
        $(item).addClass('disabled');
        if (checkbox) {
            checkbox.removeAttribute('checked');
        }
    }

    // hide filter item
    if (self.filters[hash].hidden) {
        item.style.display = 'none';
    }

    // set content
    if (field) {
        field.innerHTML = getFieldLabel.call(self, self.filters[hash].field);
    }
    if (operator) {

        var myOperator = self.filters[hash].operator;

        self.emit("message", myOperator, function (err, newOperator) {
            if(err) { return; }
            operator.innerHTML = newOperator.message;
        });
    }
    if (value) {
        value.innerHTML = self.filters[hash].value === undefined ? '' : (typeof self.filters[hash].originalValue === 'string' ? self.filters[hash].originalValue : self.filters[hash].value);
    }

    // hide edit if it's a core field
    if (edit && self.filters[hash].field[0] === '_') {
        edit.style.display = 'none';
    }

    if (!self.filters[hash].fixed) {

        if (checkbox) {
            checkbox.addEventListener('click', function (event) {
                self.emit('filtersChanged');
                if (checkbox.checked) {
                    self.emit('enableFilter', hash);
                } else {
                    self.emit('disableFilter', hash);
                }
            }, false);
        }

        // edit filter
        if (edit) {
            edit.addEventListener(self.config.ui.events.itemEdit || 'click', function (event) {
                self.emit('filtersChanged');
                event.stopPropagation();
                event.preventDefault();
                self.emit('editFilter', hash);
            }, false);
            delete edit.style.display;
        }

        // remove filter
        if (rm) {
            rm.addEventListener(self.config.ui.events.itemRemove || 'click', function (event) {
                self.emit('filtersChanged');
                event.stopPropagation();
                event.preventDefault();
                self.emit('removeFilter', hash);
            }, false);
        }
    } else {
        // TODO handle attributes with bind
        item.setAttribute('class', 'fixed' + (self.filters[hash].disabled ? ' disabled' : ''));
        if (checkbox) {
            checkbox.setAttribute('disabled', true);
        }
        if (edit) {
            edit.style.display = 'none';
        }
    }

    return item;
}

function save (hash) {
    var self = this;

    // create filter item
    var item = createFilterItem.call(self, hash);
    if (self.filters[hash].item) {
        // replace filter
        try {
        self.domRefs.list.replaceChild(item, self.filters[hash].item);
        } catch (e) {}
        //self.domRefs.list.appendChild(item);
    } else {
        // add new filter
        if (self.domRefs.list) {
            self.domRefs.list.appendChild(item);
        }
    }

    // update cache
    self.filters[hash].item = item;
}

function remove (hash) {
    var self = this;

    if (self.filters[hash]) {
        // remove dom element
        self.domRefs.list.removeChild(self.filters[hash].item);

        // remove from cache
        delete self.filters[hash];
    }
}

exports.save = save;
exports.remove = remove;


return module; });
