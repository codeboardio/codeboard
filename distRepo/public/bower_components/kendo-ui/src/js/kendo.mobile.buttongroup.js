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
    define([ "./kendo.core" ], f);
})(function(){

(function($, undefined) {
    var kendo = window.kendo,
        ui = kendo.mobile.ui,
        Widget = ui.Widget,
        ACTIVE = "km-state-active",
        DISABLE = "km-state-disabled",
        SELECT = "select",
        SELECTOR = "li:not(." + ACTIVE +")";

    function createBadge(value) {
        return $('<span class="km-badge">' + value + '</span>');
    }

    var ButtonGroup = Widget.extend({
        init: function(element, options) {
            var that = this;

            Widget.fn.init.call(that, element, options);

            that.element.addClass("km-buttongroup").find("li").each(that._button);

            that.element.on(that.options.selectOn, SELECTOR, "_select");

            that._enable = true;
            that.select(that.options.index);

            if(!that.options.enable) {
                that._enable = false;
                that.wrapper.addClass(DISABLE);
            }
        },

        events: [
            SELECT
        ],

        options: {
            name: "ButtonGroup",
            selectOn: "down",
            index: -1,
            enable: true
        },

        current: function() {
            return this.element.find("." + ACTIVE);
        },

        select: function (li) {
            var that = this,
                index = -1;

            if (li === undefined || li === -1 || !that._enable || $(li).is("." + DISABLE)) {
                return;
            }

            that.current().removeClass(ACTIVE);

            if (typeof li === "number") {
                index = li;
                li = $(that.element[0].children[li]);
            } else if (li.nodeType) {
                li = $(li);
                index = li.index();
            }

            li.addClass(ACTIVE);
            that.selectedIndex = index;
        },

        badge: function(item, value) {
            var buttongroup = this.element, badge;

            if (!isNaN(item)) {
                item = buttongroup.children().get(item);
            }

            item = buttongroup.find(item);
            badge = $(item.children(".km-badge")[0] || createBadge(value).appendTo(item));

            if (value || value === 0) {
                badge.html(value);
                return this;
            }

            if (value === false) {
                badge.empty().remove();
                return this;
            }

            return badge.html();
        },

        enable: function(enable) {
            var wrapper = this.wrapper;

            if(typeof enable == "undefined") {
                enable = true;
            }

            if(enable) {
                wrapper.removeClass(DISABLE);
            } else {
                wrapper.addClass(DISABLE);
            }

            this._enable = this.options.enable = enable;
        },

        _button: function() {
            var button = $(this).addClass("km-button"),
                icon = kendo.attrValue(button, "icon"),
                badge = kendo.attrValue(button, "badge"),
                span = button.children("span"),
                image = button.find("img").addClass("km-image");

            if (!span[0]) {
                span = button.wrapInner("<span/>").children("span");
            }

            span.addClass("km-text");

            if (!image[0] && icon) {
                button.prepend($('<span class="km-icon km-' + icon + '"/>'));
            }

            if (badge || badge === 0) {
                createBadge(badge).appendTo(button);
            }
        },

        _select: function(e) {
            if (e.which > 1 || e.isDefaultPrevented() || !this._enable) {
                return;
            }

            this.select(e.currentTarget);
            this.trigger(SELECT, { index: this.selectedIndex });
        }
    });

    ui.plugin(ButtonGroup);
})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });