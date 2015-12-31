/**
 * A directive to select the text of an input element
 * when the input element gets the focus.
 *
 * Created by hce on 24/09/15.
 */

'use strict';

angular.module('codeboardApp')
  .directive('ngSelectOnFocus', ['$timeout', function ($timeout) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var focusedElement = null;

        element.on('focus', function () {
          var self = this;
          // timeout is sometimes needed to let the browser finish rendering
          // only then can we set a focus
          $timeout(function () {
              self.select();
          }, 10);
        });
      }
    }
  }]);