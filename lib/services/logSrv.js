/**
 * Created by Martin on 09/09/14.
 */


'use strict';

// Application Config
var config = require('../config/config'),
  mongoose = require('mongoose');

// Connect to database
var db = mongoose.connect(config.mongo.uri, config.mongo.options);

// compilation schema
var Schema = mongoose.Schema;

var compilerSchema = new Schema({
  id: String,
  projectId: Number,
  startTime: Date,
  endTime: Date,
  time: Number,
  userName: String,
  language: String,
  action: String,
  description: String
});

var compilerModel = mongoose.model('compilerlog', compilerSchema); // todo angepasst

var pageViewSchema = new Schema({
  pageCode: String, //page    : String,
  date: Date,
  userName: String,
  projectId: String,
  description: String
});

var pageViewModel = mongoose.model('pageviewlog', pageViewSchema);
var events = {};


/**
 * Stores the time when the request started
 */
var startTimer = function () {
  return new Date();
};


/**
 * Returns the user name stored in the Req object, if any
 * @param req
 * @returns {*}
 */
function getUserName(req) {
  // default user name
  var usrName = '#anonymous';

  // if the user is logged in, we can get her user name
  if (req.user != undefined && req.user != null) {
    usrName = req.user.username;
  }
  else if (req.body.hasLtiData) {
    // we don't know the username but can get the lti-username
    usrName = 'lti-' + req.body.ltiData.ltiUserId;
  }

  return usrName;
}

/**
 * Logs an action (compile, run, test, tool) in the collection compilerLog
 * @param req: request object where the store username, projectId
 * @param data: compilation data: id, language, and action
 * @param desc: usually nul, except an error occurs
 * @param error: indicates if there was an error; if not, it is empty
 */
var addActionLog = function (req, startTime, data, error) {
  var id = data.id;
  var language = data.language;
  var action = data.action;

  var logData = "";
  if (data.files != null) {
    logData = logData + " - number of files " + data.files.length;
  }

  var description;
  if (data.id == undefined || (data.language == 'Eiffel' && data.clean)) {
    description = "first time" + error + logData;
  }
  else {
    description = "other" + error + logData;
  }

  // the id of project
  var projectId = req.params.projectId;
  var userName = getUserName(req);

  var endTime = new Date();
  var log = new compilerModel({
    id: id,
    projectId: projectId,
    startTime: startTime,
    endTime: endTime,
    time: Math.abs(endTime - startTime) / 1000,
    userName: userName,
    language: language,
    action: action,
    description: description
  });
  log.save(function (err) {
    if (err) {
      console.log("Error in the compilation log: " + err);
    }
  });
};

/**
 * Creates a log for accessing to a page. This function expects an object
 * with fields pageCode, page, date, and description.
 * @param log
 */
var addPageLog = function (log) {
  var log = new pageViewModel(log);

  log.save(function (err) {
    if (err) {
      console.log("Error in the sign up log");
    }
  });
};

/**
 * Show all the details of the page view and compilation logs.
 * It returns two arrays: compilerLogs and pageLogs
 * @param res
 */
var showAllLogs = function (res, limit) {
  var result = {};
  compilerModel.find()
    .sort({startTime: -1}) //Sort by Date Added DESC
    .limit(limit)
    .exec(function (err, compilerLogs) {
      if (!err) {
        result.compilerLogs = compilerLogs;
        pageViewModel.find()
          .sort({date: -1}) //Sort by Date Added DESC
          .limit(limit)
          .exec(function (err, pageLogs) {
            if (!err) {
              result.pageLogs = pageLogs;
              res.send(result);

            } else {
              console.log("Error DB");
              res.send(result);
            }
          });
      } else {
        console.log("Error DB");
        res.send(404, result);
      }
    });
};


/**
 * Show a summary of the compilation logs aggregated per day.
 * If projectId is undefined, it gets the summary for all projects, otherwise
 * it gets the summary for the 'projectId'
 */
var showCompilationPerDayLogs = function (startDate, endDate, projectId, res) {
  var startDate1 = new Date(startDate);
  var endDate1 = new Date(endDate);
  startDate1.setHours(0,0,0,0);
  endDate1.setHours(23,59,59,59);

  var inputStartDate = new Date(startDate1.toISOString());
  var inputEndDate = new Date(endDate1.toISOString());

  var result = {};
  var filterCompiler,filterRun,filterTest,filterTool;
  if (projectId == undefined) {
    filterCompiler = { $match: { $and: [
      {action: "compile"},
      {endTime: { $gte:inputStartDate, $lte:inputEndDate}}
    ]}};
    filterRun = { $match: { $and: [
      {action: "run"},
      {endTime: { $gte:inputStartDate, $lte:inputEndDate}} //{ $gte: 1, $lt: 8 }
    ]}} ;
    filterTest = { $match: { $and: [
      {action: "test"},
      {endTime: { $gte:inputStartDate, $lte:inputEndDate}} //{ $gte: 1, $lt: 8 }
    ]}} ;
    filterTool = { $match: { $and: [
      {action: "tool"},
      {endTime: { $gte:inputStartDate, $lte:inputEndDate}} //{ $gte: 1, $lt: 8 }
    ]}} ;
  }
  else {
    filterCompiler = { $match: { $and: [
      {action: "compile"},
      {endTime: { $gte:inputStartDate, $lte:inputEndDate}},
      {projectId: parseInt(projectId)}
    ]}};
    filterRun = { $match: { $and: [
      {action: "run"},
      {endTime: { $gte:inputStartDate, $lte:inputEndDate}},
      {projectId: parseInt(projectId)}
    ]}} ;
    filterTest = { $match: { $and: [
      {action: "test"},
      {endTime: { $gte:inputStartDate, $lte:inputEndDate}},
      {projectId: parseInt(projectId)}
    ]}} ;
    filterTool = { $match: { $and: [
      {action: "tool"},
      {endTime: { $gte:inputStartDate, $lte:inputEndDate}},
      {projectId: parseInt(projectId)}
    ]}} ;
  }
  compilerModel.aggregate(filterCompiler,
    { $group: {
      _id: { year: { $year: "$startTime" }, month: { $month: "$startTime" }, day: { $dayOfMonth: "$startTime" } },
      totalTime: { $sum: "$time" },
      averageTime: { $avg: "$time" },
      min: {$min: "$time" },
      max: {$max: "$time" },
      count: { $sum: 1 }
    }
    },
    function (err, compilerLogs) {
      if (!err) {
        result.compilerLogs = compilerLogs; // store 'compile' logs
        compilerModel.aggregate(filterRun,
          { $group: {
            _id: { year: { $year: "$startTime" }, month: { $month: "$startTime" }, day: { $dayOfMonth: "$startTime" } },
            totalTime: { $sum: "$time" },
            averageTime: { $avg: "$time" },
            min: {$min: "$time" },
            max: {$max: "$time" },
            count: { $sum: 1 }
          }
          },
          function (err, compilerLogs) {
            if (!err) {
              result.compilerRunLogs = compilerLogs; // store 'run' logs

              // Testing Action
              compilerModel.aggregate(filterTest,
                { $group: {
                  _id: { year: { $year: "$startTime" }, month: { $month: "$startTime" }, day: { $dayOfMonth: "$startTime" } },
                  totalTime: { $sum: "$time" },
                  averageTime: { $avg: "$time" },
                  min: {$min: "$time" },
                  max: {$max: "$time" },
                  count: { $sum: 1 }
                }
                },
                function (err, compilerLogs) {
                  if (!err) {
                    result.compilerTestLogs = compilerLogs; // store 'test' logs

                    // Tool Action
                    compilerModel.aggregate(filterTool,
                      { $group: {
                        _id: { year: { $year: "$startTime" }, month: { $month: "$startTime" }, day: { $dayOfMonth: "$startTime" } },
                        totalTime: { $sum: "$time" },
                        averageTime: { $avg: "$time" },
                        min: {$min: "$time" },
                        max: {$max: "$time" },
                        count: { $sum: 1 }
                      }
                      },
                      function (err, compilerLogs) {
                        if (!err) {
                          result.compilerToolLogs = compilerLogs; // store 'tool' logs
                          res.send(result);
                        } else {
                          console.log("Error DB");
                          res.send(404);
                        }
                      });
                  } else {
                    console.log("Error DB");
                    res.send(404);
                  }
                });
            } else {
              console.log("Error DB");
              res.send(404);
            }
          });
      } else {
        console.log("Error DB");
        res.send(404);
      }
    });
};

/**
 * Show a summary of the compilation logs aggregated per hour (and day)
 */
var showCompilationPerHourLogs = function (res) {
  var result = {};
  compilerModel.aggregate(
    { $match: { action: "compile"  } },
    { $group: {
      _id: { year: { $year: "$startTime" }, month: { $month: "$startTime" }, day: { $dayOfMonth: "$startTime" }, hour: {$hour: "$startTime"} },
      totalTime: { $sum: "$time" },
      averageTime: { $avg: "$time" },
      min: {$min: "$time" },
      max: {$max: "$time" },
      count: { $sum: 1 }
    }
    },
    function (err, compilerLogs) {
      if (!err) {
        result.compilerLogs = compilerLogs;
        compilerModel.aggregate(
          { $match: { action: "run"  } },
          { $group: {
            _id: { year: { $year: "$startTime" }, month: { $month: "$startTime" }, day: { $dayOfMonth: "$startTime" }, hour: {$hour: "$startTime"} },
            totalTime: { $sum: "$time" },
            averageTime: { $avg: "$time" },
            min: {$min: "$time" },
            max: {$max: "$time" },
            count: { $sum: 1 }
          }
          },
          function (err, compilerLogs) {
            if (!err) {
              result.compilerRunLogs = compilerLogs;
              res.send(result);
            } else {
              console.log("Error DB");
              res.send(404);
            }
          });
      } else {
        console.log("Error DB");
        res.send(404);
      }
    });
};

/**
 * Show a summary of the compilation logs aggregated per hour (and day)
 */
var showCompilerActivityPerUser = function (res) {
  var result = {};
  compilerModel.aggregate(
    { $match: { action: "compile"  } },
    {
      $group: {
        _id: "$userName",
        lastDate: { $last: "$startTime" },
        lastProject: { $last: "$projectId" },
        countProjectAccess: { $sum: 1 }
      }
    },
    function (err, compilerLogs) {
      if (!err) {
        result.compilerLogs = compilerLogs;
        compilerModel.aggregate(
          { $match: { action: "run"  } },
          {
            $group: {
              _id: "$userName",
              lastDate: { $last: "$startTime" },
              lastProject: { $last: "$projectId" },
              countProjectAccess: { $sum: 1 }
            }
          },
          function (err, compilerRunLogs) {
            if (!err) {
              result.compilerRunLogs = compilerRunLogs;
              res.send(result);
            } else {
              console.log("Error DB");
              res.send(404);
            }
          });
      } else {
        console.log("Error DB");
        res.send(404);
      }
    });
};


/**
 * Show a summary of the compilation logs aggregated per hour (and day)
 */
var showCompilerActivityPerProject = function (projectId, startDate, endDate, res) {
  var startDate1 = new Date(startDate);
  var endDate1 = new Date(endDate);
  startDate1.setHours(0,0,0,0);
  endDate1.setHours(23,59,59,59);

  var inputStartDate = new Date(startDate1.toISOString());
  var inputEndDate = new Date(endDate1.toISOString());

  var result = {};
  compilerModel.aggregate(
    { $match: { $and: [
      {projectId: projectId},
      {action: "compile"  },
      {endTime: { $gte:inputStartDate, $lte:inputEndDate}}
    ]} },
    {
      $group: {
        _id: "$userName",
        lastDate: { $last: "$startTime" },
        lastProject: { $last: "$projectId" },
        countProjectAccess: { $sum: 1 }
      }
    },
    function (err, compilerLogs) {
      if (!err) {
        result.compilerLogs = compilerLogs;
        compilerModel.aggregate(
          { $match: { $and: [
            {projectId: projectId},
            {action: "run" },
            {endTime: { $gte:inputStartDate, $lte:inputEndDate}}
          ]} },
          {
            $group: {
              _id: "$userName",
              lastDate: { $last: "$startTime" },
              lastProject: { $last: "$projectId" },
              countProjectAccess: { $sum: 1 }
            }
          },
          function (err, compilerRunLogs) {
            if (!err) {
              result.compilerRunLogs = compilerRunLogs;
              res.send(result);
            } else {
              console.log("Error DB");
              res.send(404);
            }
          });
      } else {
        console.log("Error DB");
        res.send(404);
      }
    });
};


/**
 * Show a summary of the project access for a all projects, grouped by user
 */
var showProjectAccessPerUser = function (res) {
  var result = {};
  pageViewModel.aggregate(
    { $match: { $or: [
      { pageCode: '11'  },
      { pageCode: '9'  }
    ]  } },
    {
      $group: {
        _id: "$userName",
        lastDate: { $last: "$date" },
        lastProject: { $last: "$projectId" },
        countProjectAccess: { $sum: 1 }
      }
    },
    function (err, projectAccess) {
      if (!err) {
        result.projectAccess = projectAccess;
        res.send(result);
      } else {
        console.log("Error DB");
        res.send(404);
      }
    });
};

/**
 * Show a summary of the project access for a particular projectId, grouped by user
 */
var showProjectAccessPerProject = function (projectId, startDate, endDate, res) {
  var startDate1 = new Date(startDate);
  var endDate1 = new Date(endDate);
  startDate1.setHours(0,0,0,0);
  endDate1.setHours(23,59,59,59);

  var inputStartDate = new Date(startDate1.toISOString());
  var inputEndDate = new Date(endDate1.toISOString());
  var filter = { $match: { $and: [
    {projectId: projectId},
    {$or: [
      { pageCode: '11'  },
      { pageCode: '9'  }
    ]},
    {date: { $gte:inputStartDate, $lte:inputEndDate}}
  ]  } };

  var result = {};
  pageViewModel.aggregate(filter,
    {
      $group: {
        _id: "$userName",
        lastDate: { $last: "$date" },
        lastProject: { $last: "$projectId" },
        countProjectAccess: { $sum: 1 }
      }
    },
    function (err, projectAccess) {
      if (!err) {
        result.projectAccess = projectAccess;
        res.send(result);
      } else {
        console.log("Error DB");
        res.send(404);
      }
    });
};


/**
 * Shows the submitions done per project
 * @param projectId
 * @param res
 */
var showSubmitPerProject = function (projectId, startDate, endDate, res) {
  var startDate1 = new Date(startDate);
  var endDate1 = new Date(endDate);
  startDate1.setHours(0,0,0,0);
  endDate1.setHours(23,59,59,59);

  var inputStartDate = new Date(startDate1.toISOString());
  var inputEndDate = new Date(endDate1.toISOString());

  var result = {};
  pageViewModel.aggregate(
    { $match: { $and: [
      {projectId: projectId},
      { pageCode: '16'  },
      {date: { $gte:inputStartDate, $lte:inputEndDate}}
    ]  } },
    {
      $group: {
        _id: "$userName",
        lastDate: { $last: "$date" },
        lastProject: { $last: "$projectId" },
        countProjectAccess: { $sum: 1 }
      }
    },
    function (err, submissions) {
      if (!err) {
        result.submitLogs = submissions;
        res.send(result);
      } else {
        console.log("Error DB");
        res.send(404);
      }
    });
};


var showSubmitPerUserLogs = function (res) {
  var result = {};
  pageViewModel.aggregate(
    { $match: {  pageCode: '16'  } },
    {
      $group: {
        _id: "$userName",
        lastDate: { $last: "$date" },
        lastProject: { $last: "$projectId" },
        countProjectAccess: { $sum: 1 }
      }
    },
    function (err, submissions) {
      if (!err) {
        result.submitLogs = submissions;
        res.send(result);
      } else {
        console.log("Error DB");
        res.send(404);
      }
    });
};

var showProjectAccessPerDayLogs = function (startDate, endDate, projectId, res) {
  var startDate1 = new Date(startDate);
  var endDate1 = new Date(endDate);
  startDate1.setHours(0,0,0,0);
  endDate1.setHours(23,59,59,59);

  var inputStartDate = new Date(startDate1.toISOString());
  var inputEndDate = new Date(endDate1.toISOString());
  var filter;
  if (projectId == undefined) {
    filter = { $and: [
      {$or: [
        { pageCode: '11'  },
        { pageCode: '9'  } ]
      },
      {date: { $gte:inputStartDate, $lte:inputEndDate}}
    ]};
  }
  else {
    filter = { $and: [
      {$or: [
        { pageCode: '11'  },
        { pageCode: '9'  } ]
      },
      {date: { $gte:inputStartDate, $lte:inputEndDate}},
      {projectId: projectId}
    ]};
  }
  var result = {};
  pageViewModel.aggregate(
    { $match: filter
    },
    { $group: {
      _id: { year: { $year: "$date" }, month: { $month: "$date" }, day: { $dayOfMonth: "$date" } },
      count: { $sum: 1 }
    }
    },
    function (err, accesses) {
      if (!err) {
        result.projectAccessPerDay = accesses;
        res.send(result);
      } else {
        console.log("Error DB");
        res.send(404);
      }
    });
};


var showActiveProjectPerDayLogs = function (startDate, endDate, res) {
  var startDate1 = new Date(startDate);
  var endDate1 = new Date(endDate);
  startDate1.setHours(0,0,0,0);
  endDate1.setHours(23,59,59,59);

  var inputStartDate = new Date(startDate1.toISOString());
  var inputEndDate = new Date(endDate1.toISOString());
  var filter = { $and: [
    {$or: [
      { pageCode: '11'  },
      { pageCode: '9'  } ]
    },
    {date: { $gte:inputStartDate, $lte:inputEndDate}}
  ]};

  var result = {};
  pageViewModel.aggregate(
    { $match: filter
    },
    { $group: {
      _id: { year: { $year: "$date" }, month: { $month: "$date" }, day: { $dayOfMonth: "$date" }, projectId: "$projectId" }
    }
    },
    { $group: {
      _id: { year: "$_id.year" , month: "$_id.month" , day:  "$_id.day"  },
      count: { $sum: 1 }
    }
    },
    function (err, accesses) {
      if (!err) {
        result.activeProjectPerDay = accesses;
        res.send(result);
      } else {
        console.log("Error DB");
        res.send(404);
      }
    });
};



var showCompilationsPerLanguage = function (startDate, endDate, res) {
  var startDate1 = new Date(startDate);
  var endDate1 = new Date(endDate);
  startDate1.setHours(0,0,0,0);
  endDate1.setHours(23,59,59,59);

  var inputStartDate = new Date(startDate1.toISOString());
  var inputEndDate = new Date(endDate1.toISOString());

  var result = {};
  // calculate compilations and run per language
  compilerModel.aggregate(
    { $match: { $and: [
      {$or: [
        { action: "compile"  },
        { action: "run"  } ]},
      {startTime: { $gte:inputStartDate, $lte:inputEndDate}}
    ]}
    },
    { $group: {
      _id: "$language",
      count: { $sum: 1 }
    }
    },
    function (err, compLanguages) {
      if (!err) {
        result.languageLogs = compLanguages;
        // calculate compilations only per language
        compilerModel.aggregate(
          { $match: { $and: [
            { action: "compile"  },
            {startTime: { $gte:inputStartDate, $lte:inputEndDate}}
          ]}
          },
          { $group: {
            _id: "$language",
            count: { $sum: 1 }
          }
          },
          function (err, compOnlyLanguages) {
            if (!err) {
              result.languageCompilationLogs = compOnlyLanguages;
              // calculate runs only per language
              compilerModel.aggregate(
                { $match: { $and: [
                  { action: "run"  },
                  {startTime: { $gte:inputStartDate, $lte:inputEndDate}}
                ]}
                },
                { $group: {
                  _id: "$language",
                  count: { $sum: 1 }
                }
                },
                function (err, runOnlyLanguages) {
                  if (!err) {
                    result.languageRunLogs = runOnlyLanguages;
                    res.send(result);
                  } else {
                    console.log("Error DB");
                    res.send(404);
                  }
                });
            } else {
              console.log("Error DB");
              res.send(404);
            }
          });
      } else {
        console.log("Error DB");
        res.send(404);
      }
    });
};


var showCompilationsErrors = function (startDate, endDate, res) {
  var startDate1 = new Date(startDate);
  var endDate1 = new Date(endDate);
  startDate1.setHours(0,0,0,0);
  endDate1.setHours(23,59,59,59);

  var inputStartDate = new Date(startDate1.toISOString());
  var inputEndDate = new Date(endDate1.toISOString());

  var result = {};
  // calculate compilations errors: number of normal compilation, number of slow compilations, number of too slow compilation, and number of errors
  // normal compilations
  compilerModel.aggregate(
    { $match: { $and: [
        {action: "compile"},
        {time: { $gte: 1, $lt: 8 }},
        {startTime: { $gte:inputStartDate, $lte:inputEndDate}}] }
    },
    { $group: {
      _id: null,
      count: { $sum: 1 }
    }
    },
    function (err, normalCompLanguages) {
      if (!err) {
        if (normalCompLanguages[0]!=undefined) {
          result.normal=normalCompLanguages[0].count;
        }
        else {
          result.normal=0;
        }
        // slow compilations
        compilerModel.aggregate(
          { $match: { $and: [
            { action: "compile"  },
            {time: { $gte: 8, $lt: 12 }},
            {startTime: { $gte:inputStartDate, $lte:inputEndDate}}] }
          },
          { $group: {
            _id: null,
            count: { $sum: 1 }
          }
          },
          function (err, slowCompLanguages) {
            if (!err) {
              if (slowCompLanguages[0]!=undefined) {
                result.slow=slowCompLanguages[0].count;
              }
              else {
                result.slow=0;
              }
              // too slow compilations
              compilerModel.aggregate(
                { $match: { $and: [
                  { action: "compile"  },
                  {time: { $gte: 12 }},
                  {startTime: { $gte:inputStartDate, $lte:inputEndDate}}] }
                },
                { $group: {
                  _id: null,
                  count: { $sum: 1 }
                }
                },
                function (err, tooSlowCompLanguages) {
                  if (!err) {
                    if (tooSlowCompLanguages[0]!=undefined) {
                      result.tooSlow=tooSlowCompLanguages[0].count;
                    }
                    else {
                      result.tooSlow=0;
                    }
                    // error compilations
                    compilerModel.aggregate(
                      { $match: { $and: [
                        { action: "compile"  },
                        {time: { $lt: 1 }},
                        {startTime: { $gte:inputStartDate, $lte:inputEndDate}}] }
                      },
                      { $group: {
                        _id: null,
                        count: { $sum: 1 }
                      }
                      },
                      function (err, errorCompLanguages) {
                        if (!err) {
                          if (errorCompLanguages[0]!=undefined) {
                            result.error=errorCompLanguages[0].count;
                          }
                          else {
                            result.error=0;
                          }

                          res.send(result);
                        } else {
                          console.log("Error DB");
                          res.send(404);
                        }
                      });
                    // end slow
                  } else {
                    console.log("Error DB");
                    res.send(404);
                  }
                });
              // end too slow
            } else {
              console.log("Error DB");
              res.send(404);
            }
          });
          // end slow

      } else {
        console.log("Error DB");
        res.send(404);
      }
    });
};


/**
 * Generates a list of the 50 projects with more user access during the startDate and endDate
 * @param startDate
 * @param endDate
 * @param res
 */
var showPopularProjects = function (startDate, endDate, limit, res) {
  var startDate1 = new Date(startDate);
  var endDate1 = new Date(endDate);
  startDate1.setHours(0,0,0,0);
  endDate1.setHours(23,59,59,59);

  var inputStartDate = new Date(startDate1.toISOString());
  var inputEndDate = new Date(endDate1.toISOString());
  var filter = { $and: [
    {$or: [
      { pageCode: '11'  },
      { pageCode: '9'  } ]
    },
    {date: { $gte:inputStartDate, $lte:inputEndDate}}
  ]};

  var result = {};
  pageViewModel.aggregate(
    { $match: filter
    },
    { $group: {
      _id: { projectId: "$projectId" },
      count: { $sum: 1 }
    }
    },
    { $sort: {count:-1}},
    { $limit: limit },
    function (err, popularProjects) {
      if (!err) {
        result.popularProjects = popularProjects;
        res.send(result);
      } else {
        console.log("Error DB");
        res.send(404);
      }
    });
};

/**
 * Log for creating a new user
 * @param user
 * @returns {{pageCode: number, date: Date, userName: string}}
 */
events.createUserEvent = function (req) {
  return {
    pageCode: 1, //'successful user creation',
    date: new Date(),
    userName: req.body.username
  };
};

/**
 * Log for fail user creation
 * @param user
 * @returns {pageCode: number, date: Date, user: string}}
 */
events.failCreateUserEvent = function (req) {
  return {
    pageCode: 2, //'fail user creation',
    date: new Date(),
    userName: req.body.username
  };
};


events.signinEvent = function (req, user) {
  return {
    pageCode: 3,// 'sign in',
    date: new Date(),
    userName: user
  };
};


events.failedSigninEvent = function (req) {
  return {
    pageCode: 4,// 'failed sign in',
    date: new Date(),
    userName: req.body.username,
    description: 'wrong password'
  };
};


events.signoutEvent = function (req) {
  return {
    pageCode: 5, //'sign out',
    date: new Date(),
    userName: getUserName(req)
  };
};


events.createProjectEvent = function (req, pr) {
  return {
    pageCode: 6, // 'create project
    date: new Date(),
    userName: getUserName(req),
    projectId: pr
  };
};


events.failedCreateProjectEvent = function (req) {
  return {
    pageCode: 7, // 'failed create project
    date: new Date(),
    userName: getUserName(req),
    projectId: req.body.projectname
  };
};


// TODO: refactor
events.modifyProjectEvent = function (us, pr) {
  return {
    pageCode: 8, // 'modify project
    date: new Date(),
    userName: us,
    projectId: pr
  };
};


events.openFullProjectEvent = function (req) {
  return {
    pageCode: 9, // 'open a full project (even with hiden files)
    date: new Date(),
    userName: getUserName(req),
    projectId: req.params.projectId
  };
};


events.openNonExistingProjectEvent = function (req) {
  return {
    pageCode: 10, // 'open non existing project
    date: new Date(),
    userName: getUserName(req),
    projectId: req.params.projectId
  };
};


events.openLimitedProjectEvent = function (req) {
  return {
    pageCode: 11, // 'open limited project'
    date: new Date(),
    userName: getUserName(req),
    projectId: req.params.projectId
  };
};


events.accessUserProfileEvent = function (req) {
  return {
    pageCode: 12, // 'access user profile'
    date: new Date(),
    userName: getUserName(req)
  };
};


events.updateUserProfileEvent = function (req) {
  return {
    pageCode: 13, // 'update user profile'
    date: new Date(),
    userName: req.params.username
  };
};


events.accessProjectProfileEvent = function (req) {
  return {
    pageCode: 14, // 'access project profile'
    date: new Date(),
    userName: getUserName(req),
    projectId: req.params.projectId
  };
};


events.updateProjectProfileEvent = function (req) {
  return {
    pageCode: 15, // 'update project profile'
    date: new Date(),
    userName: getUserName(req),
    projectId: req.params.projectId
  };
};


events.submitEvent = function (req) {
  return {
    pageCode: 16, // 'submit project'
    date: new Date(),
    userName: getUserName(req),
    projectId: req.params.projectId
  };
};


events.resetPasswordEvent = function (req, user) {
  return {
    pageCode: 17,// 'sign in',
    date: new Date(),
    userName: getUserName(req)
  };
};

// export the service functions
exports.addActionLog = addActionLog;
exports.addPageLog = addPageLog;
exports.startTimer = startTimer;
exports.showAllLogs = showAllLogs;
exports.showCompilationPerDayLogs = showCompilationPerDayLogs;
exports.showCompilationPerHourLogs = showCompilationPerHourLogs;
exports.showCompilerActivityPerUser = showCompilerActivityPerUser;
exports.showProjectAccessPerUser = showProjectAccessPerUser;
exports.showProjectAccessPerProject = showProjectAccessPerProject;
exports.showCompilerActivityPerProject = showCompilerActivityPerProject;
exports.showSubmitPerUserLogs = showSubmitPerUserLogs;
exports.showSubmitPerProject = showSubmitPerProject;
exports.showProjectAccessPerDayLogs = showProjectAccessPerDayLogs;
exports.showCompilationsPerLanguage = showCompilationsPerLanguage;
exports.showCompilationsErrors = showCompilationsErrors;
exports.showActiveProjectPerDayLogs = showActiveProjectPerDayLogs;
exports.showPopularProjects = showPopularProjects;
exports.events = events;
