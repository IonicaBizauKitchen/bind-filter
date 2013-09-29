M.wrap('github/IonicaBizau/bind-filter/dev/find.js', function (require, module, exports) {
var currentFilters = {};

function queryBuilder (filters) {
    var self = this;
    var query = {};
    var fieldsInQuery = {};

    for (filter in filters) {
        if (!filters.hasOwnProperty(filter)) return;

        if (!filters[filter].disabled && self.config.operators[filters[filter].operator]) {

            var expression = {};
            var values = filters[filter];
            var value = values.value;
            var operator = self.config.operators[values.operator];


            // handle operators
            if (operator[0]) {
                expression[values.field] = {};
                expression[values.field][operator[0]] = value;
            } else {
                expression[values.field] = value;
            }

            // handle or
            if (fieldsInQuery[values.field]) {
                if (operator[0] === '') {
                    // create or array and move the existing expression to the array
                    if (!query.$or) {
                        query.$or = [{}];
                        query.$or[0][values.field] = query[values.field];
                        delete query[values.field];
                    }
                    query.$or.push(expression);
                } else {
                    query[values.field][operator[0]] = value;
                }
            } else {
                query[values.field] = expression[values.field];
            }

            fieldsInQuery[values.field] = 1;
        }
    }
    return {
        t: self.template,
        q: query,
        o: self.options
    };
}

function find (all) {
    var self = this;

    if (!self.template) {
        return self.emit('result', new Error('NO_TEMPLATE_SELECTED'));
    }

    if (self.crudFindBusy) {
        return self.emit('result', new Error('FILTER_IS_BUSY'));
    }

    self.crudFindBusy = true;

    // build queries
    self.query = all ? {} : queryBuilder.call(self, self.filters);

    if (!self.query) {

        if (self.wasEmpty) {
            self.crudFindBusy = false;
            return self.emit('result', new Error('NO_FILTERS_SELECTED'));
        }

        self.wasEmpty = true;
        self.query = {};
    } else {
        self.wasEmpty = false;
    }

    // get data with crud module
    return self.emit('find', self.query, function (err, data, xhr) {
        self.crudFindBusy = false;
        var count = xhr.getResponseHeader('X-Mono-CRUD-Count');
        self.emit('result', err, data, count);
    });
}

module.exports = find;


return module; });
