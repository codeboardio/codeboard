/**
 * Created by Martin on 27/01/15.
 */
'use strict';

angular.module('codeboardApp')
  .service('IdeSnippetsSrv', function IdeSnippetsSrv() {
    // AngularJS will instantiate a singleton by calling "new" on this function


    /**
     * Returns msg object for request that a file should be displayed in the editor.
     * @param {number} aNodeId the unique id of the node that should be displayed
     * @return {{msg: string, data: {nodeId: *}}}
     */
    this.getEiffelSnippet = function () {
      return [
        {
          content: 'feature {${1:CLASS}} -- ${2:comment}',
          name: 'feature modifier',
          tabTrigger: 'feature'
        },
        {
          content: 'note\n\tdescription : "Description of the class"\n\tauthor      : "Name of author"\n\n' +
            'class\n\t${1:CLASS_NAME}\n\ninherit\n\t${2:CLASS_INHERIT}\n\nfeature {${3:CLASS_FEATURE}} -- ${4: feature comment}\n\n\t${5:--Add your routines here}\n\nend',
          name: 'class',
          tabTrigger: 'class'
        },
        {
          content: '${1:name}: ${2:type} = ${3}',
          name: 'const',
          tabTrigger: 'const'
        },
        {
          content: 'inspect\n\t${1:exp}\nwhen ${2:value} then\n\t${3:-- code 1 here}\nelse\n\t${4:-- code 2 here}\nend',
          name: 'inspect',
          tabTrigger: 'inspect'
        },
        {
          content: 'when ${2:value} then\n\t${3:-- code here}',
          name: 'when',
          tabTrigger: 'when'
        },
        {
          content: 'from\n\t${1}\nuntil\n\t${2}\nloop\n\t${3}\nend',
          name: 'from loop',
          tabTrigger: 'from_loop'
        },
        {
          content: 'across ${1:my_list} as ${2:ic} loop ${3:print(ic.item)} end',
          name: 'across loop',
          tabTrigger: 'across_loop'
        },
       {
          content: 'if ${1:exp} then\n\t${2:-- code here }\nend',
          name: 'if',
          tabTrigger: 'if'
        },
        {
          content: 'if ${1:exp} then\n\t${2:-- code}\nelse\n\t${3:-- code here}\nend',
          name: 'ifelse',
          tabTrigger: 'ifelse'
        },
        {
          content: '${1:routine_name} (${2:i: INTEGER})\n\t\t${3:-- feature comment}\n\trequire\n\t\t${4:-- preconditions}\n\tdo\n\t\t${5:-- code here}\n\tensure\n\t\t${6:-- postconditions}\n\tend',
          name: 'routine',
          tabTrigger: 'routine'
        },
        {
          content: 'check\n\t${1:assertion}\nend ',
          name: 'check',
          tabTrigger: 'check'
        },
        {
          content: 'create ${1:var}.make (${2:arguments}) ',
          name: 'create',
          tabTrigger: 'create'
        },
        {
          content: 'local\n\t${1:var}: ${2:type}',
          name: 'local',
          tabTrigger: 'local'
        },
        {
          content: 'print("${1:message}%N")',
          name: 'Hint: print message',
          tabTrigger: 'hint_print'
        },
        {
          content: 'from\n\tmy_list.start\nuntil\n\tmy_list.off\nloop\n\tprint (my_list.item)\n\tmy_list.forth\nend',
          name: 'Hint: from-loop over a list',
          tabTrigger: 'hint_from_loop_over_a_list'
        },
        {
          content: 'across my_list as ic loop print (ic.item) end',
          name: 'Hint: across-loop over a list',
          tabTrigger: 'hint_across_loop_over_a_list'
        }
      ];
    };
  });
