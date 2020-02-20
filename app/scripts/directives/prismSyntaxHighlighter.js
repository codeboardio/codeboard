/**
 * This file contains two directives. Both related to prism
 * The first directive is used to compile dynamic content (in our case the projectDescription)
 * after the page is loaded.
 * @src https://stackoverflow.com/questions/17417607/angular-ng-bind-html-and-directive-within-it
 *
 * The second one is required to use PrismJs together with AngularJs
 * @src https://gist.github.com/dyaa/f668fb3fb5e7bb8ec30d
 */

'use strict';
angular.module('codeboardApp').directive('bindHtmlCompile', ['$compile', function ($compile) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            scope.$watch(function () {
                return scope.$eval(attrs.bindHtmlCompile);
            }, function (value) {
                // Incase value is a TrustedValueHolderType, sometimes it
                // needs to be explicitly called into a string in order to
                // get the HTML string.
                element.html(value && value.toString());
                // If scope is provided use it, otherwise use parent scope
                var compileScope = scope;
                if (attrs.bindHtmlScope) {
                    compileScope = scope.$eval(attrs.bindHtmlScope);
                }
                $compile(element.contents())(compileScope);
            });
        }
    };
}]);

angular.module('codeboardApp').directive('prism', [function() {
    return {
        restrict: 'A',
        link: function ($scope, element, attrs) {
            element.ready(function() {
                Prism.highlightElement(element[0]);
            });
        }
    };
}]);