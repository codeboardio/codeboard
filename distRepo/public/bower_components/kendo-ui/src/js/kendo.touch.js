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
    define([ "./kendo.core", "./kendo.userevents" ], f);
})(function(){

(function($, undefined) {
    var kendo = window.kendo,
        Widget = kendo.ui.Widget,
        proxy = $.proxy,
        abs = Math.abs,
        MAX_DOUBLE_TAP_DISTANCE = 20;

    var Swipe = kendo.Class.extend({
        init: function(element, callback, options) {
            options = $.extend({
                minXDelta: 30,
                maxYDelta: 20,
                maxDuration: 1000
            }, options);

            new kendo.UserEvents(element, {
                surface: options.surface,
                allowSelection: true,

                start: function(e) {
                    if (abs(e.x.velocity) * 2 >= abs(e.y.velocity)) {
                        e.sender.capture();
                    }
                },

                move: function(e) {
                    var touch = e.touch,
                    duration = e.event.timeStamp - touch.startTime,
                    direction = touch.x.initialDelta > 0 ? "right" : "left";

                    if (
                        abs(touch.x.initialDelta) >= options.minXDelta &&
                        abs(touch.y.initialDelta) < options.maxYDelta &&
                    duration < options.maxDuration)
                    {
                        callback({
                            direction: direction,
                            touch: touch,
                            target: touch.target
                        });

                        touch.cancel();
                    }
                }
            });
        }
    });

    var Touch = Widget.extend({
        init: function(element, options) {
            var that = this;

            Widget.fn.init.call(that, element, options);
            options = that.options;

            element = that.element;
            that.wrapper = element;

            function eventProxy(name) {
                return function(e) {
                    that._triggerTouch(name, e);
                };
            }

            function gestureEventProxy(name) {
                return function(e) {
                    that.trigger(name, { touches: e.touches, distance: e.distance, center: e.center, event: e.event });
                };
            }

            that.events = new kendo.UserEvents(element, {
                filter: options.filter,
                surface: options.surface,
                minHold: options.minHold,
                multiTouch: options.multiTouch,
                allowSelection: true,
                press: eventProxy("touchstart"),
                hold: eventProxy("hold"),
                tap: proxy(that, "_tap"),
                gesturestart: gestureEventProxy("gesturestart"),
                gesturechange: gestureEventProxy("gesturechange"),
                gestureend: gestureEventProxy("gestureend")
            });

            if (options.enableSwipe) {
                that.events.bind("start", proxy(that, "_swipestart"));
                that.events.bind("move", proxy(that, "_swipemove"));
            } else {
                that.events.bind("start", proxy(that, "_dragstart"));
                that.events.bind("move", eventProxy("drag"));
                that.events.bind("end", eventProxy("dragend"));
            }

            kendo.notify(that);
        },

        events: [
            "touchstart",
            "dragstart",
            "drag",
            "dragend",
            "tap",
            "doubletap",
            "hold",
            "swipe",
            "gesturestart",
            "gesturechange",
            "gestureend"
        ],

        options: {
            name: "Touch",
            surface: null,
            global: false,
            multiTouch: false,
            enableSwipe: false,
            minXDelta: 30,
            maxYDelta: 20,
            maxDuration: 1000,
            minHold: 800,
            doubleTapTimeout: 800
        },

        cancel: function() {
            this.events.cancel();
        },

        _triggerTouch: function(type, e) {
            if (this.trigger(type, { touch: e.touch, event: e.event })) {
                e.preventDefault();
            }
        },

        _tap: function(e) {
            var that = this,
                lastTap = that.lastTap,
                touch = e.touch;

            if (lastTap &&
                (touch.endTime - lastTap.endTime < that.options.doubleTapTimeout) &&
                kendo.touchDelta(touch, lastTap).distance < MAX_DOUBLE_TAP_DISTANCE
                ) {

               that._triggerTouch("doubletap", e);
               that.lastTap = null;
            } else {
                that._triggerTouch("tap", e);
                that.lastTap = touch;
            }
        },

        _dragstart: function(e) {
            this._triggerTouch("dragstart", e);
        },

        _swipestart: function(e) {
            if (abs(e.x.velocity) * 2 >= abs(e.y.velocity)) {
                e.sender.capture();
            }
        },

        _swipemove: function(e) {
            var that = this,
                options = that.options,
                touch = e.touch,
                duration = e.event.timeStamp - touch.startTime,
                direction = touch.x.initialDelta > 0 ? "right" : "left";

            if (
                abs(touch.x.initialDelta) >= options.minXDelta &&
                abs(touch.y.initialDelta) < options.maxYDelta &&
                duration < options.maxDuration
                )
            {
                that.trigger("swipe", {
                    direction: direction,
                    touch: e.touch
                });

                touch.cancel();
            }
        }
    });


    window.jQuery.fn.kendoMobileSwipe = function(callback, options) {
        this.each(function() {
            new Swipe(this, callback, options);
        });
    };

    kendo.ui.plugin(Touch);
})(window.kendo.jQuery);

return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });