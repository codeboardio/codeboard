/**
 * A reusable component for sync the scrolling between the code-editor and the window for the variable scope visualization.
 *
 *
 * @author Samuel Truniger
 * @date 08.05.2023
 */
angular.module('codeboardApp').directive('syncScroll', [
    '$document',
    function ($document) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var aceEditor = ace.edit('ace_editor');
                var scrollbar = aceEditor.container.querySelector('.ace_scrollbar');

                scrollbar.addEventListener('scroll', function () {
                    var scrollTop = scrollbar.scrollTop;
                    // got this code with the help of ChatGPT
                    $document[0].getElementById('varScope_editor').style.transform = `translateY(-${scrollTop}px)`;
                });
            },
        };
    },
]);
