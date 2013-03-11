/**
 * View that represents all grid filters
 *
 * @class   OroApp.DatagridFilterList
 * @extends Backbone.View
 */
OroApp.DatagridFilterList = Backbone.View.extend({
    /** @property */
    filters: {},

    /** @property */
    addButtonTemplate: _.template(
        '<a href="#" class="btn btn-link btn-group"><%= addButtonHint %></a>' +
            '<select id="add-filter-select" multiple>' +
            '<% _.each(filters, function (filter, name) { %>' +
            '<option value="<%= name %>" <% if (filter.enabled) { %>selected<% } %>>' +
            '<%= filter.hint %>' +
            '</option>' +
            '<% }); %>' +
            '</select>'
    ),

    /** @property */
    filterSelector: '#add-filter-select',

    /** @property */
    addButtonHint: 'Add filter',

    /** @property */
    events: {
        'change #add-filter-select': '_processFilterStatus'
    },

    /**
     * Initialize filter list options
     *
     * @param {Object} options
     * @param {OroApp.PageableCollection} [options.collection]
     * @param {Object} [options.filters]
     * @param {String} [options.addButtonHint]
     */
    initialize: function(options)
    {
        this.collection = options.collection;

        if (options.filters) {
            this.filters = options.filters;
        }

        if (options.addButtonHint) {
            this.addButtonHint = options.addButtonHint;
        }

        for (var name in this.filters) {
            this.filters[name] = new (this.filters[name])();
            this.listenTo(this.filters[name], "changedData", this._reloadCollection);
            this.listenTo(this.filters[name], "disabled", this.disableFilter);
        }

        this._saveState();
        this.collection.on('reset', this._restoreState, this);
        this.collection.on('updateState', this.updateState, this);

        Backbone.View.prototype.initialize.apply(this, arguments);
    },

    _saveState: function() {
        this.collection.state.filters = this._createState();
        this.collection.state.filtersParams = this.getAllParameters();
    },

    updateState: function(collection, options) {
        this._restoreState(collection, options);
        this._saveState();
    },

    _restoreState: function(collection, options) {
        if (options.ignoreUpdateFilters) {
            return;
        }
        this._applyState(collection.state.filters ? collection.state.filters : {});
    },

    /**
     * Activate/deactivate all filter depends on its status
     *
     * @private
     */
    _processFilterStatus: function() {
        var activeFilters = this.$(this.filterSelector).val();

        _.each(this.filters, function(filter, name) {
            if (!filter.enabled && _.indexOf(activeFilters, name) != -1) {
                this.enableFilter(filter);
            } else if (filter.enabled && _.indexOf(activeFilters, name) == -1) {
                this.disableFilter(filter);
            }
        }, this);
    },

    /**
     * Enable filter
     *
     * @param {OroApp.DatagridFilter} filter
     */
    enableFilter: function(filter) {
        filter.enable();
        var optionSelector = this.filterSelector + ' option[value="' + filter.name + '"]';
        this.$(optionSelector).attr('selected', 'selected');
    },

    /**
     * Disable filter
     *
     * @param {OroApp.DatagridFilter} filter
     */
    disableFilter : function(filter) {
        filter.disable();
        this._saveState();
        var optionSelector = this.filterSelector + ' option[value="' + filter.name + '"]';
        this.$(optionSelector).removeAttr('selected');
    },

    /**
     * Render filter list
     *
     * @return {*}
     */
    render: function () {
        this.$el.empty();

        for (var name in this.filters) {
            this.filters[name].render();
            if (!this.filters[name].enabled) {
                this.filters[name].hide();
            }
            this.$el.append(this.filters[name].$el);
        }

        this.$el.append(this.addButtonTemplate({
            filters: this.filters,
            addButtonHint: this.addButtonHint
        }));

        this.trigger("rendered");

        return this;
    },

    /**
     * Reload collection data with current filters
     *
     * @private
     * @return {*}
     */
    _reloadCollection: function() {
        this._saveState();
        this.collection.state.currentPage = 1;
        this.collection.fetch({
            ignoreUpdateFilters: true
        });
        return this;
    },

    /**
     * Create state according to filters parameters
     *
     * @return {Object}
     * @private
     * @return {*}
     */
    _createState: function() {
        var state = {};
        for (var name in this.filters) {
            var filter = this.filters[name];
            if (filter.enabled) {
                var filterParameters = filter.getParameters();
                var value = {}
                _.each(_.keys(filterParameters), function(key) {
                    if (filterParameters[key]) {
                        value[key] = filterParameters[key];
                    }
                })
                var valueKeys = _.keys(value);
                if (valueKeys.length == 1 && valueKeys[0] == '[value]') {
                    state[name] = value['[value]'];
                } else if (valueKeys.length) {
                    state[name] = value;
                } else {
                    state['__' + name] = 1;
                }
            }
        }

        return state;
    },

    /**
     * Get parameters of all filters
     *
     * @return {Object}
     */
    getAllParameters: function() {
        var result = {};
        for (var name in this.filters) {
            var filter = this.filters[name];
            if (filter.enabled) {
                var parameters = filter.getParameters();
                if (parameters) {
                    result[name] = parameters;
                }
            }
        }
        return result;
    },

    /**
     * Apply filter parameters stored in state
     *
     * @param state
     * @private
     * @return {*}
     */
    _applyState: function(state) {
        for (var filterName in this.filters) {
            var filter = this.filters[filterName];
            if (filterName in state) {
                var filterState = state[filterName];
                if (!_.isObject(filterState)) {
                    filterState = {
                        '[value]': filterState
                    }
                }
                filter.enable().setParameters(filterState);
            } else if ('__' + filterName in state) {
                filter.reset().enable();
            } else {
                filter.reset().disable();
            }
        }
        return this;
    }
});
