/**
 * This service allows access to various variables within the project.
 *
 * @author Samuel Truniger
 */

angular.module('codeboardApp').service('CodeboardSrv', [
  'ProjectFactory',
  function (ProjectFactory) {
    var service = this;
    var disabledActions = [];
    var enabledActions = [];

    // this function gets all current disabledActions
    service.getDisabledActions = () => {
      // check for disabled action in the context of a course
      let courseData = ProjectFactory.getProject().courseData;
      if (typeof courseData !== 'undefined' && courseData.hasOwnProperty('courseOptions')) {
        let courseUserDisabledActions = courseData.courseOptions.find((o) => o.option === 'userDisabledActions');
        if (typeof courseUserDisabledActions !== 'undefined') {
          disabledActions = disabledActions.concat(courseUserDisabledActions.value.split('|'));
        }
      }

      // check for disabled actions in the context of a project
      if (ProjectFactory.hasConfig('userDisabledActions')) {
        disabledActions = disabledActions.concat(ProjectFactory.getConfig().userDisabledActions);
      }

      return disabledActions;
    };

    // this function gets all current enabled actions of a project
    service.getEnabledActions = () => {
      if (ProjectFactory.hasConfig('userEnabledActions')) {
        enabledActions = ProjectFactory.getConfig().userEnabledActions;
      }

      return enabledActions;
    };
  },
]);
