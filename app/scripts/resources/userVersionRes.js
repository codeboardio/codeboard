/**
 * Resources for functionality that is linked to user versions
 *
 * @author Janick Michot
 */

'use strict';


angular.module('codeboardApp')

    .factory('ideInitialDataForUserVersion', ['$resource', '$q', '$http', '$route',
        function($resource, $q, $http, $route) {

            return function(projectId, userVersionId, userVersionType) {

                let deferred = $q.defer();

                $http.get('/api/projects/' + projectId + '/' + userVersionType + '/' + userVersionId)
                    .then(function (response) {

                        // we got the data from the sever but it's not in the exact form that the IdeCtrl expects
                        // thus we reformat it here; we also have to calculate the lastUId (though the user is not likely to add files)

                        let projectData = {
                            projectname: response.data.project.projectname,
                            language: response.data.project.language,
                            userRole: $route.current.params.versionType,
                            username: response.data.user.username, // the user that's being inspected
                            updatedAt: response.data.updatedAt
                        };

                        // construct the fileSet
                        if(response.data.hiddenFilesDump !== null) {
                            projectData.fileSet = response.data.userFilesDump.concat(response.data.hiddenFilesDump);
                        } else {
                            projectData.fileSet = response.data.userFilesDump;
                        }

                        // calculate the lastUId by iterating over all files in fileSet
                        let _lastUId = 0;
                        projectData.fileSet.every(function (elem) {
                            if (elem.uniqueId > _lastUId) {
                                _lastUId = elem.uniqueId;
                            }
                        });
                        projectData.lastUId = _lastUId;

                        // we always disable the option to "submit" when looking at a submission
                        projectData.isSubmissionAllowed = false;

                        deferred.resolve(projectData);
                    });

                return deferred.promise;
            };
    }]);