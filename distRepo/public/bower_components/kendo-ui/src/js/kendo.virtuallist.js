/**
 * Copyright 2015 Telerik AD
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function(f, define){
    define([ "./kendo.data" ], f);
})(function(){

(function($, undefined) {
    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget,
        DataBoundWidget = ui.DataBoundWidget,
        proxy = $.proxy,

        WRAPPER = "k-virtual-wrap",
        VIRTUALLIST = "k-virtual-list",
        CONTENT = "k-virtual-content",
        LIST = "k-list",
        HEADER = "k-virtual-header",
        VIRTUALITEM = "k-virtual-item",
        ITEM = "k-item",
        OPTIONLABEL = "k-virtual-option-label",
        HEIGHTCONTAINER = "k-height-container",
        GROUPITEM = "k-group",

        SELECTED = "k-state-selected",
        FOCUSED = "k-state-focused",
        CHANGE = "change",
        CLICK = "click",
        LISTBOUND = "listBound",
        ITEMCHANGE = "itemChange",

        ACTIVATE = "activate",
        DEACTIVATE = "deactivate",

        VIRTUAL_LIST_NS = ".VirtualList";

    function lastFrom(array) {
        return array[array.length - 1];
    }

    function toArray(value) {
        return value instanceof Array ? value : [value];
    }

    function isPrimitive(dataItem) {
        return typeof dataItem === "string" || typeof dataItem === "number" || typeof dataItem === "boolean";
    }

    function getItemCount(screenHeight, listScreens, itemHeight) {
        return Math.ceil(screenHeight * listScreens / itemHeight);
    }

    function appendChild(parent, className, tagName) {
        var element = document.createElement(tagName || "div");
        if (className) {
            element.className = className;
        }
        parent.appendChild(element);

        return element;
    }

    function getDefaultItemHeight() {
        var mockList = $('<div class="k-popup"><ul class="k-list"><li class="k-item"><li></ul></div>'),
            lineHeight;
        mockList.css({
            position: "absolute",
            left: "-200000px",
            visibility: "hidden"
        });
        mockList.appendTo(document.body);
        lineHeight = parseFloat(kendo.getComputedStyles(mockList.find(".k-item")[0], ["line-height"])["line-height"]);
        mockList.remove();

        return lineHeight;
    }

    function bufferSizes(screenHeight, listScreens, opposite) { //in pixels
        return {
            down: screenHeight * opposite,
            up: screenHeight * (listScreens - 1 - opposite)
        };
    }

    function listValidator(options, screenHeight) {
        var downThreshold = (options.listScreens - 1 - options.threshold) * screenHeight;
        var upThreshold = options.threshold * screenHeight;

        return function(list, scrollTop, lastScrollTop) {
            if (scrollTop > lastScrollTop) {
                return scrollTop - list.top < downThreshold;
            } else {
                return list.top === 0 || scrollTop - list.top > upThreshold;
            }
        };
    }

    function scrollCallback(element, callback) {
        return function(force) {
            return callback(element.scrollTop, force);
        };
    }

    function syncList(reorder) {
        return function(list, force) {
            reorder(list.items, list.index, force);
            return list;
        };
    }

    function position(element, y) {
        if (kendo.support.browser.msie && kendo.support.browser.version < 10) {
            element.style.top = y + "px";
        } else {
            element.style.webkitTransform = 'translateY(' + y + "px)";
            element.style.transform = 'translateY(' + y + "px)";
        }
    }

    function map2(callback, templates) {
        return function(arr1, arr2) {
            for (var i = 0, len = arr1.length; i < len; i++) {
                callback(arr1[i], arr2[i], templates);
                if (arr2[i].item) {
                    this.trigger(ITEMCHANGE, { item: $(arr1[i]), data: arr2[i].item, ns: kendo.ui });
                    if (arr2[i].index === this._selectedIndex) {
                        this.select(this._selectedIndex);
                    }
                }
            }
        };
    }

    function reshift(items, diff) {
        var range;

        if (diff > 0) { // down
            range = items.splice(0, diff);
            items.push.apply(items, range);
        } else { // up
            range = items.splice(diff, -diff);
            items.unshift.apply(items, range);
        }

        return range;
    }

    function render(element, data, templates) {
        var itemTemplate = templates.template;

        element = $(element);

        if (!data.item) {
            itemTemplate = templates.placeholderTemplate;
        }

        this.angular("cleanup", function() {
            return { elements: [ element ]};
        });

        element
            .attr("data-uid", data.item ? data.item.uid : "")
            .attr("data-offset-index", data.index)
            .find("." + ITEM)
            .html(itemTemplate(data.item || {}));

        element.toggleClass(FOCUSED, data.current);
        element.toggleClass(SELECTED, data.selected);
        element.toggleClass("k-first", data.newGroup);

        if (data.newGroup) {
            $("<div class=" + GROUPITEM + "></div>")
                .appendTo(element.find("." + ITEM))
                .html(templates.groupTemplate({ group: data.group }));
        }

        if (data.top !== undefined) {
            position(element[0], data.top);
        }

        this.angular("compile", function() {
            return { elements: [ element ], data: [ { dataItem: data.item, group: data.group, newGroup: data.newGroup } ]};
        });
    }

    var VirtualList = DataBoundWidget.extend({
        init: function(element, options) {
            var that = this;
            that._listCreated = false;
            that._fetching = false;
            that._filter = false;

            Widget.fn.init.call(that, element, options);

            element = that.element;
            element.addClass(VIRTUALLIST);

            if (!that.options.itemHeight) {
                that.options.itemHeight = getDefaultItemHeight();
            }

            options = that.options;

            that.wrapper = element.wrap("<div class='" + WRAPPER + "' role='listbox'></div>").parent();
            that.header = that.element.before("<div class='" + HEADER + "'></div>").prev();
            that.content = element.append("<ul class='" + CONTENT + " " + LIST + "'></ul>").find("." + CONTENT);

            that._values = toArray(that.options.value);
            that._selectedDataItems = [];
            that._selectedIndexes = [];
            that._rangesList = {};
            that._activeDeferred = null;
            that._promisesList = [];
            that._optionID = kendo.guid();

            that.setDataSource(options.dataSource);

            element.on("scroll" + VIRTUAL_LIST_NS, function() {
                that._renderItems();
            });

            that._selectable();
        },

        options: {
            name: "VirtualList",
            autoBind: true,
            height: null,
            listScreens: 4,
            threshold: 0.5,
            itemHeight: null,
            oppositeBuffer: 1,
            type: "flat",
            selectable: false,
            value: [],
            dataValueField: null,
            template: "#:data#",
            placeholderTemplate: "loading...",
            groupTemplate: "#:group#",
            fixedGroupTemplate: "fixed header template",
            optionLabel: null,
            valueMapper: null
        },

        events: [
            CHANGE,
            CLICK,
            LISTBOUND,
            ITEMCHANGE,
            ACTIVATE,
            DEACTIVATE
        ],

        setOptions: function(options) {
            Widget.fn.setOptions.call(this, options);

            if (this._selectProxy && this.options.selectable === false) {
                this.wrapper.off(CLICK, "." + VIRTUALITEM + ", ." + OPTIONLABEL, this._selectProxy);
            } else if (!this._selectProxy && this.options.selectable) {
                this._selectable();
            }

            this.refresh();
        },

        items: function() {
            return $(this._items);
        },

        destroy: function() {
            this.wrapper.off(VIRTUAL_LIST_NS);
            this.element.off(VIRTUAL_LIST_NS);
            this.dataSource.unbind(CHANGE, this._refreshHandler);
            Widget.fn.destroy.call(this);
        },

        setDataSource: function(source) {
            var that = this,
                dataSource = source || {};

            dataSource = $.isArray(dataSource) ? {data: dataSource} : dataSource;

            that.dataSource = kendo.data.DataSource.create(dataSource);
            that._refreshHandler = $.proxy(that.refresh, that);

            that.dataSource.bind(CHANGE, that._refreshHandler);

            if (that.dataSource.view().length !== 0) {
                that.refresh();
            } else if (that.options.autoBind) {
                that.dataSource.fetch();
            }
        },

        refresh: function() {
            var that = this;

            if (that._mute) { return; }

            if (!that._fetching) {
                that._createList();
                if (that._values.length && !that._filter) {
                    that._prefetchByValue(that._values);
                }
                that._listCreated = true;
                that.trigger(LISTBOUND);
            } else {
                if (that._renderItems) {
                    that._renderItems(true);
                }
                //that.trigger(LISTBOUND);
            }

            that._fetching = false;
        },

        value: function(value, silent) {
            var that = this,
                dataSource = that.dataSource,
                deferred = $.Deferred();

            if (value === undefined) {
                return that._values;
            }

            if (silent) {
                that._values = value = toArray(value);
                return;
            }

            if (value === "" || value === null) {
                value = [];
            }

            if (value instanceof Array && !value.length) {
                that.select(-1);
                return;
            }

            that._selectedDataItems = [];
            that._selectedIndexes = [];
            that._values = value = toArray(value);

            if (that.isBound()) {
                that._prefetchByValue(value);
            }
        },

        _prefetchByValue: function(value) {
            var that = this,
                dataView = that._dataView,
                valueGetter = that._valueGetter,
                item, match = false,
                forSelection = [];

            //try to find the items in the loaded data
            for (var i = 0; i < value.length; i++) {
                for (var idx = 0; idx < dataView.length; idx++) {
                    item = dataView[idx].item;
                    if (item) {
                        match = isPrimitive(item) ? value[i] === item : value[i] === valueGetter(item);

                        if (match) {
                            forSelection.push(idx);
                        }
                    }
                }
            }

            if (forSelection.length === value.length) {
                that._values = [];
                that.select(forSelection);
                return;
            }

            //prefetch the items
            if (typeof that.options.valueMapper === "function") {
                that.options.valueMapper({
                    value: (this.options.selectable === "multiple") ? value : value[0],
                    success: function(indexes) {
                        that._values = [];
                        that.select(toArray(indexes));
                    }
                });
            } else {
                throw new Error("valueMapper is not provided");
            }
        },

        deferredRange: function(index) {
            var dataSource = this.dataSource;
            var take = this.itemCount;
            var ranges = this._rangesList;
            var result = $.Deferred();
            var defs = [];


            var low = Math.floor(index / take) * take;
            var high = Math.ceil(index / take) * take;

            var pages = high  === low ? [ high ] : [ low, high ];

            $.each(pages, function(_, skip) {
                var end = skip + take;
                var existingRange = ranges[skip];
                var deferred;

                if (!existingRange || (existingRange.end !== end)) {
                    deferred = $.Deferred();
                    ranges[skip] = { end: end, deferred: deferred };

                    dataSource._multiplePrefetch(skip, take, function() {
                        deferred.resolve();
                    });
                } else {
                    deferred = existingRange.deferred;
                }

                defs.push(deferred);
            });

            $.when.apply($, defs).then(function() {
                result.resolve();
            });

            return result;
        },

        prefetch: function(indexes) {
            var that = this,
                take = this.itemCount,
                dataSource = this.dataSource,
                isEmptyList = !that._promisesList.length;

            if (!that._activeDeferred) {
                that._activeDeferred = $.Deferred();
                that._promisesList = [];
            }

            $.each(indexes, function(_, index) {
                var rangeStart = Math.floor(index / take) * take;
                that._promisesList.push(that.deferredRange(rangeStart));
            });

            if (isEmptyList) {
                $.when.apply($, that._promisesList).done(function() {
                    //that._renderItems(true);
                    that._activeDeferred.resolve();
                    that._activeDeferred = null;
                    that._promisesList = [];
                });
            }

            return this._activeDeferred;
        },

        _findDataItem: function(index) {
            var view = this.dataSource.view(),
                group;

            //find in grouped view
            if (this.options.type === "group") {
                for (var i = 0; i < view.length; i++) {
                    group = view[i].items;
                    if (group.length < index) {
                        index = index - group.length;
                    } else {
                        return group[index];
                    }
                }
            }

            //find in flat view
            return view[index];
        },

        selectedDataItems: function() {
            return this._selectedDataItems;
        },

        scrollTo: function(y) {
            this.element.scrollTop(y); //works only if the element is visible
        },

        scrollToIndex: function(index) {
            this.scrollTo(index * this.options.itemHeight);
        },

        focus: function(candidate) {
            var element,
                index,
                data,
                dataSource = this.dataSource,
                current,
                itemHeight = this.options.itemHeight,
                id = this._optionID;

            if (candidate === undefined) {
                current = this.content.find("." + FOCUSED);
                return current.length ? current : null;
            }

            if (typeof candidate === "function") {
                data = this.data();
                for (var idx = 0; idx < data.length; idx++) {
                    if (candidate(data[idx])) {
                        candidate = idx;
                        break;
                    }
                }
            }

            if (candidate instanceof Array) {
                candidate = lastFrom(candidate);
            }

            if (isNaN(candidate)) {
                element = $(candidate);
                index = parseInt($(element).attr("data-offset-index"), 10);
            } else {
                index = candidate;
                element = this._getElementByIndex(index);
            }

            if (index === -1) { //this will be in conflict with the optionLabel
                this.content.find("." + FOCUSED).removeClass(FOCUSED);
                this._focusedIndex = undefined;
                return;
            }

            if (element.length) { /*focus rendered item*/
                if (element.hasClass(FOCUSED)) {
                    return;
                } else {
                    if (this._focusedIndex !== undefined) {
                        current = this._getElementByIndex(this._focusedIndex);
                        current
                            .removeClass(FOCUSED)
                            .removeAttr("id");

                        this.trigger(DEACTIVATE);
                    }

                    this._focusedIndex = index;

                    element
                        .addClass(FOCUSED)
                        .attr("id", id);

                    var position = this._getElementLocation(index);

                    if (position === "top") {
                        this.scrollTo(index * itemHeight);
                    } else if (position === "bottom") {
                        this.scrollTo((index * itemHeight + itemHeight) - this.screenHeight);
                    }

                    this.trigger(ACTIVATE);
                }
            } else { /*focus non rendered item*/
                this._focusedIndex = index;
                this.items().add(this.optionLabel).removeClass(FOCUSED);
                this.scrollToIndex(index);
            }
        },

        first: function() {
            this.scrollTo(0);
            this.focus(0);
        },

        last: function() {
            var lastIndex = this.dataSource.total();
            this.scrollTo(this.heightContainer.offsetHeight);
            this.focus(lastIndex);
        },

        prev: function() {
            var index = this._focusedIndex;

            if (!isNaN(index) && index > 0) {
                this.focus(index - 1);
                return index - 1;
            }
        },

        next: function() {
            var index = this._focusedIndex,
                lastIndex = this.dataSource.total() - 1; /* data offset index starts from 0*/

            if (!isNaN(index) && index < lastIndex) {
                this.focus(index + 1);
                return index + 1;
            }
        },

        select: function(candidate) {
            var that = this;
            var indexes,
                singleSelection = this.options.selectable !== "multiple",
                prefetchStarted = !!this._activeDeferred,
                deferred,
                added = [],
                removed = [];

            if (candidate === undefined) {
                return this._selectedIndexes.slice();
            }

            indexes = this._getIndecies(candidate);

            if (!indexes.length || (singleSelection && lastFrom(indexes) === lastFrom(this._selectedIndexes))) { return; }

            removed = this._deselect(indexes);

            if (!indexes.length) {
                this.trigger(CHANGE, {
                    added: added,
                    removed: removed
                });
            } else {
                if (singleSelection) {
                    this._activeDeferred = null;
                    prefetchStarted = false;
                    indexes = [lastFrom(indexes)];
                }

                var done = function() {
                    added = that._select(indexes); //???
                    that.focus(indexes);

                    if (added.length || removed.length) {
                        that.trigger(CHANGE, {
                            added: added,
                            removed: removed
                        });
                    }
                };

                deferred = this.prefetch(indexes);

                if (!prefetchStarted) {
                    if (deferred) {
                        deferred.done(done);
                    } else {
                        done();
                    }
                }
            }
        },

        data: function() {
            var data = this.dataSource.view(),
                first = this.optionInstance,
                length = data.length,
                idx = 0;

            if (first && length) {
                first = new kendo.data.ObservableArray([first]);

                for (; idx < length; idx++) {
                    first.push(data[idx]);
                }
                data = first;
            }

            return data;
        },

        isBound: function() {
            return this._listCreated;
        },

        mute: function(callback) {
            this._mute = true;
            proxy(callback(), this);
            this._mute = false;
        },

        filter: function(filter) {
            if (filter === undefined) {
                return this._filter;
            }
            this._filter = filter;
        },

        clearIndices: function() {
            this._selectedIndexes = [];
        },

        _getElementByIndex: function(index) {
            var element;

            if (index === -1) {
                element = this.optionLabel;
            } else {
                element = this.items().filter(function(idx, element) {
                    return index === parseInt($(element).attr("data-offset-index"), 10);
                });
            }

            return element;
        },

        _clean: function() {
            this.result = undefined;
            this._lastScrollTop = undefined;
            if (this.optionLabel) {
                this.optionLabel.parent().remove();
                this.optionLabel = undefined;
            }
            this.content.empty();
        },

        _screenHeight: function() {
            var height = this.options.height,
                element = this.element;

            if (height) {
                element.height(height);
            } else {
                height = element.height();
            }

            this.screenHeight = height;
        },

        _getElementLocation: function(index) {
            var scrollTop = this.element.scrollTop(),
                screenHeight = this.screenHeight,
                itemHeight = this.options.itemHeight,
                yPosition = index * itemHeight,
                yDownPostion = yPosition + itemHeight,
                screenEnd = scrollTop + screenHeight,
                position;

            if (yPosition === (scrollTop - itemHeight) || (yDownPostion > scrollTop && yPosition < scrollTop)) {
                position = "top";
            } else if (yPosition === screenEnd || (yPosition < screenEnd && screenEnd < yDownPostion)) {
                position = "bottom";
            } else if ((yPosition >= scrollTop) && (yPosition <= scrollTop + (screenHeight - itemHeight))) {
                position = "inScreen";
            } else {
                position = "outScreen";
            }

            return position;
        },

        _templates: function() {
            var templates = {
                template: this.options.template,
                placeholderTemplate: this.options.placeholderTemplate,
                groupTemplate: this.options.groupTemplate,
                fixedGroupTemplate: this.options.fixedGroupTemplate
            };

            for (var key in templates) {
                if (typeof templates[key] !== "function") {
                    templates[key] = kendo.template(templates[key]);
                }
            }

            this.templates = templates;
        },

        _generateItems: function(element, count) {
            var items = [],
                item;

            while(count-- > 0) {
                item = document.createElement("li");
                item.tabIndex = -1;
                item.className = VIRTUALITEM;
                item.setAttribute("role", "option");
                item.innerHTML = "<div class='" + ITEM + "'></div>";
                element.appendChild(item);

                items.push(item);
            }

            return items;
        },

        _saveInitialRanges: function() {
            var ranges = this.dataSource._ranges;
            var deferred = $.Deferred();
            deferred.resolve();

            this._rangesList = {};
            for (var i = 0; i < ranges.length; i++) {
                this._rangesList[ranges[i].start] = { end: ranges[i].end, deferred: deferred };
            }
        },

        _createList: function() {
            var that = this,
                element = that.element.get(0),
                options = that.options,
                dataSource = that.dataSource,
                total = dataSource.total();

            if (that._listCreated) {
                that._clean();
            }

            that._saveInitialRanges();
            that._screenHeight();
            that._buildValueGetter();
            that.itemCount = getItemCount(that.screenHeight, options.listScreens, options.itemHeight);

            if (that.itemCount > dataSource.total()) {
                that.itemCount = dataSource.total();
            }

            that._templates();
            that._optionLabel();
            that._items = that._generateItems(that.content[0], that.itemCount);

            that._setHeight(options.itemHeight * dataSource.total());
            that.options.type = !!dataSource.group().length ? "group" : "flat";

            that.getter = that._getter(function() {
                that._renderItems(true);
            });

            that._onScroll = function(scrollTop, force) {
                var getList = that._listItems(that.getter);
                return that._fixedHeader(scrollTop, getList(scrollTop, force));
            };

            that._renderItems = that._whenChanged(
                scrollCallback(element, that._onScroll),
                syncList(that._reorderList(that._items, $.proxy(render, that)))
            );

            that._renderItems();
        },

        _setHeight: function(height) {
            var currentHeight,
                heightContainer = this.heightContainer;

            if (!heightContainer) {
                heightContainer = this.heightContainer = appendChild(this.element[0], HEIGHTCONTAINER);
            } else {
                currentHeight = heightContainer.offsetHeight;
            }

            if (height !== currentHeight) {
                heightContainer.innerHTML = "";

                while (height > 0) {
                    var padHeight = Math.min(height, 250000); //IE workaround, should not create elements with height larger than 250000px
                    appendChild(heightContainer).style.height = padHeight + "px";
                    height -= padHeight;
                }
            }
        },

        _getter: function() {
            var lastRequestedRange = null,
                dataSource = this.dataSource,
                lastRangeStart = dataSource.skip(),
                type = this.options.type,
                pageSize = this.itemCount,
                flatGroups = {};

            return function(index, rangeStart) {
                var that = this;
                if (!dataSource.inRange(rangeStart, pageSize)) {
                    if (lastRequestedRange !== rangeStart) {
                        lastRequestedRange = rangeStart;
                        lastRangeStart = rangeStart;
                        this._fetching = true;
                        this.deferredRange(rangeStart).then(function() {
                            that._fetching = true;
                            dataSource.range(rangeStart, pageSize);
                        });
                    }

                    return null;
                } else {
                    if (lastRangeStart !== rangeStart) {
                        this._mute = true;
                        this._fetching = true;
                        dataSource.range(rangeStart, pageSize);
                        lastRangeStart = rangeStart;
                        this._mute = false;
                    }

                    var result;
                    if (type === "group") { //grouped list
                        if (!flatGroups[rangeStart]) {
                            var flatGroup = flatGroups[rangeStart] = [];
                            var groups = dataSource.view();
                            for (var i = 0, len = groups.length; i < len; i++) {
                                var group = groups[i];
                                for (var j = 0, groupLength = group.items.length; j < groupLength; j++) {
                                    flatGroup.push({ item: group.items[j], group: group.value });
                                }
                            }
                        }

                        result = flatGroups[rangeStart][index - rangeStart];
                    } else { //flat list
                        result = dataSource.view()[index - rangeStart];
                    }

                    return result;
                }
            };
        },

        _fixedHeader: function(scrollTop, list) {
            var group = this.currentVisibleGroup,
                itemHeight = this.options.itemHeight,
                firstVisibleDataItemIndex = Math.floor((scrollTop - list.top) / itemHeight),
                firstVisibleDataItem = list.items[firstVisibleDataItemIndex];

            if (firstVisibleDataItem && firstVisibleDataItem.item) {
                var firstVisibleGroup = firstVisibleDataItem.group;

                if (firstVisibleGroup !== group) {
                    this.header[0].innerHTML = "";
                    appendChild(this.header[0], GROUPITEM).innerHTML = firstVisibleGroup;
                    this.currentVisibleGroup = firstVisibleGroup;
                }
            }

            return list;
        },

        _itemMapper: function(item, index) {
            var listType = this.options.type,
                itemHeight = this.options.itemHeight,
                value = this._values,
                currentIndex = this._focusedIndex,
                selected = false,
                current = false,
                newGroup = false,
                group = null,
                nullIndex = -1,
                match = false,
                valueGetter = this._valueGetter;

            if (listType === "group") {
                if (item) {
                    newGroup = index === 0 || (this._currentGroup && this._currentGroup !== item.group);
                    this._currentGroup = item.group;
                }

                group = item ? item.group : null;
                item = item ? item.item : null;
            }

            if (value.length && item) {
                for (var i = 0; i < value.length; i++) {
                    match = isPrimitive(item) ? value[i] === item : value[i] === valueGetter(item);
                    if (match) {
                        selected = true;
                        break;
                    }
                }
            }

            if (currentIndex === index) {
                current = true;
            }

            return {
                item: item ? item : null,
                group: group,
                newGroup: newGroup,
                selected: selected,
                current: current,
                index: index,
                top: index * itemHeight
            };
        },

        _range: function(index) {
            var itemCount = this.itemCount,
                items = [],
                item;

            this._view = {};
            this._currentGroup = null;

            for (var i = index, length = index + itemCount; i < length; i++) {
                item = this._itemMapper(this.getter(i, index), i);
                items.push(item);
                this._view[item.index] = item;
            }

            this._dataView = items;
            return items;
        },

        _getDataItemsCollection: function(scrollTop, lastScrollTop) {
            var items = this._range(this._listIndex(scrollTop, lastScrollTop));
            return {
                index: items.length ? items[0].index : 0,
                top: items.length ? items[0].top : 0,
                items: items
            };
        },

        _listItems: function(getter) {
            var screenHeight = this.screenHeight,
                itemCount = this.itemCount,
                options = this.options;

            var theValidator = listValidator(options, screenHeight);

            return $.proxy(function(value, force) {
                var result = this.result,
                    lastScrollTop = this._lastScrollTop;

                if (force || !result || !theValidator(result, value, lastScrollTop)) {
                    result = this._getDataItemsCollection(value, lastScrollTop);
                }

                this._lastScrollTop = value;
                this.result = result;

                return result;
            }, this);
        },

        _whenChanged: function(getter, callback) {
            var current;

            return function(force) {
                var theNew = getter(force);

                if (theNew !== current) {
                    current = theNew;
                    callback(theNew, force);
                }
            };
        },

        _reorderList: function(list, reorder) {
            var that = this;
            var length = list.length;
            var currentOffset = -Infinity;
            reorder = $.proxy(map2(reorder, this.templates), this);

            return function(list2, offset, force) {
                var diff = offset - currentOffset;
                var range, range2;

                if (force || Math.abs(diff) >= length) { // full reorder
                    range = list;
                    range2 = list2;
                } else { // partial reorder
                    range = reshift(list, diff);
                    range2 = diff > 0 ? list2.slice(-diff) : list2.slice(0, -diff);
                }

                reorder(range, range2, that._listCreated);

                currentOffset = offset;
            };
        },

        _bufferSizes: function() {
            var options = this.options;

            return bufferSizes(this.screenHeight, options.listScreens, options.oppositeBuffer);
        },

        _indexConstraint: function(position) {
            var itemCount = this.itemCount,
                itemHeight = this.options.itemHeight,
                total = this.dataSource.total();

            return Math.min(total - itemCount, Math.max(0, Math.floor(position / itemHeight )));
        },

        _listIndex: function(scrollTop, lastScrollTop) {
            var buffers = this._bufferSizes(),
                position;

            position = scrollTop - ((scrollTop > lastScrollTop) ? buffers.down : buffers.up);

            return this._indexConstraint(position);
        },

        _selectable: function() {
            if (this.options.selectable) {
                this._selectProxy = $.proxy(this, "_clickHandler");
                this.wrapper.on(CLICK + VIRTUAL_LIST_NS, "." + VIRTUALITEM + ", ." + OPTIONLABEL, this._selectProxy);
            }
        },

        _getIndecies: function(candidate) {
            var result = [], data;

            if (typeof candidate === "function") {
                data = this.data();
                for (var idx = 0; idx < data.length; idx++) {
                    if (candidate(data[idx])) {
                        result.push(idx);
                        break;
                    }
                }
            }

            if (typeof candidate === "number") {
                result.push(candidate);
            }

            if (candidate instanceof jQuery) {
                candidate = parseInt(candidate.attr("data-offset-index"), 10);
                if (!isNaN(candidate)) {
                    result.push(candidate);
                }
            }

            if (candidate instanceof Array) {
                result = candidate;
            }

            return result;
        },

        _deselect: function(indexes) {
            var removed = [],
                index,
                selectedIndex,
                dataItem,
                selectedIndexes = this._selectedIndexes,
                position = 0,
                selectable = this.options.selectable,
                removedindexesCounter = 0;

            if (indexes[position] === -1) { //deselect everything
                for (var idx = 0; idx < selectedIndexes.length; idx++) {
                    selectedIndex = selectedIndexes[idx];

                    removed.push({
                        index: selectedIndex,
                        position: idx,
                        dataItem: this._selectedDataItems[idx]
                    });
                }

                this._values = [];
                this._selectedDataItems = [];
                this._selectedIndexes = [];
                indexes.splice(0, indexes.length);

                return removed;
            }

            if (selectable === true) {
                index = indexes[position];
                selectedIndex = selectedIndexes[position];

                if (selectedIndex !== undefined && index !== selectedIndex) {
                    this._getElementByIndex(selectedIndex).removeClass(SELECTED);

                    removed.push({
                        index: selectedIndex,
                        position: position,
                        dataItem: this._selectedDataItems[position]
                    });

                    this._values = [];
                    this._selectedDataItems = [];
                    this._selectedIndexes = [];
                }
            } else if (selectable === "multiple") {
                for (var i = 0; i < indexes.length; i++) {
                    position = $.inArray(indexes[i], selectedIndexes);
                    selectedIndex = selectedIndexes[position];

                    if (selectedIndex !== undefined) {
                        this._getElementByIndex(selectedIndex).removeClass(SELECTED);
                        this._values.splice(position, 1);
                        this._selectedIndexes.splice(position, 1);
                        dataItem = this._selectedDataItems.splice(position, 1);

                        indexes.splice(i, 1);

                        removed.push({
                            index: selectedIndex,
                            position: position + removedindexesCounter,
                            dataItem: dataItem
                        });

                        removedindexesCounter++;
                        i--;
                    }
                }
            }

            return removed;
        },

        _select: function(indexes) {
            var that = this,
                singleSelection = this.options.selectable !== "multiple",
                dataSource = this.dataSource,
                index, dataItem, selectedValue, element,
                page, skip, oldSkip,
                take = this.itemCount,
                valueGetter = this._valueGetter,
                added = [];

            if (singleSelection) {
                that._selectedIndexes = [];
                that._selectedDataItems = [];
                that._values = [];
            }

            oldSkip = dataSource.skip();

            $.each(indexes, function(_, index) {
                var page = index < take ? 1 : Math.floor(index / take) + 1;
                var skip = (page - 1) * take;

                that.mute(function() {
                    dataSource.range(skip, take); //switch the range to get the dataItem

                    dataItem = that._findDataItem([index - skip]);
                    that._selectedIndexes.push(index);
                    that._selectedDataItems.push(dataItem);
                    that._values.push(isPrimitive(dataItem) ? dataItem : valueGetter(dataItem));

                    added.push({
                        index: index,
                        dataItem: dataItem
                    });

                    that._getElementByIndex(index).addClass(SELECTED);

                    dataSource.range(oldSkip, take); //switch back the range
                });
            });

            return added;
        },

        _clickHandler: function(e) {
            if (!e.isDefaultPrevented()) {
                this.trigger(CLICK, { item: $(e.currentTarget) });
            }
        },

        _optionLabel: function() {
            var optionInstance = this.options.optionLabel;

            if (optionInstance && typeof optionInstance === "object") {
                this.element
                    .before("<ul class='" + LIST + "'><li tabindex='-1' class='" + OPTIONLABEL + "' role='option'><div class='" + ITEM + "'></div></li></ul>");

                this.optionLabel = this.wrapper.find("." + OPTIONLABEL);
                render.call(this, this.optionLabel, { index: -1, top: null, selected: false, current: false, item: optionInstance }, this.templates);
                this.optionInstance = optionInstance;
            } else {
                this.optionInstance = null;
            }

        },

        _buildValueGetter: function() {
            this._valueGetter = kendo.getter(this.options.dataValueField);
        }

    });

    kendo.ui.VirtualList = VirtualList;
    kendo.ui.plugin(VirtualList);

})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });