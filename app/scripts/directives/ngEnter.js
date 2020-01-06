'use strict';

angular.module('codeboardApp')
  .directive('ngEnter', function () {
    return function(scope, element, attrs) {
      element.bind("keydown keypress", function(event) {
        if(event.which === 13) {
          scope.$apply(function () {
            scope.$eval(attrs.ngEnter);
          });

          event.preventDefault();
        }
      });
    };
  })

  /**
   * Sets focus on the child element defined in `ng-focus-child`
   * @author Janick Michot
   */
  .directive('ngFocusChild', function () {
    return function(scope, element, attrs) {
      element.bind("click", function(event) {
        let input = element[0].querySelector(attrs.ngFocusChild);
        if (input) {
          input.focus();
        }
      });
    };
  });
