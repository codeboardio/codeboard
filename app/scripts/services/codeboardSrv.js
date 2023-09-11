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

    // available disabled actions (can be set in "new course" / "course settings")
    service.actions = [
      {
        name: 'home',
        desc: 'The home button ("Zurück zur Übersicht")',
      },
      {
        name: 'edit',
        desc: 'Edit button',
      },
      {
        name: 'compile',
        desc: 'Compile button (Run)',
      },
      {
        name: 'run',
        desc: 'Run button',
      },
      {
        name: 'save',
        desc: 'Save project button',
      },
      {
        name: 'full-screen',
        desc: 'Full-screen button',
      },
      {
        name: 'tree-view',
        desc: 'Tree-view on the left side',
      },
      {
        name: 'unredo',
        desc: 'Unredo button',
      },
      {
        name: 'reset',
        desc: 'Reset button (Original wiederherstellen)',
      },
      {
        name: 'varScope',
        desc: 'Variable Scope button',
      },
      {
        name: 'beautify',
        desc: 'Beautify button',
      },
      {
        name: 'syntax-checker',
        desc: 'The sytax-checker which highlight errors on the left side of the editor',
      },
      {
        name: 'editor-settings',
        desc: 'The settings of the ace editor',
      },
      {
        name: 'info',
        desc: 'The info tab (Info)',
      },
      {
        name: 'test',
        desc: 'The test tab (Test)',
      },
      {
        name: 'explanation',
        desc: 'The explanation tab (Erklärungen)',
      },
      {
        name: 'compiler',
        desc: 'The compiler tab (Compiler)',
      },
      {
        name: 'tips',
        desc: 'The tips tab (Tipps)',
      },
      {
        name: 'questions',
        desc: 'The questions tab (Fragen)',
      },
    ];
  },
]);
