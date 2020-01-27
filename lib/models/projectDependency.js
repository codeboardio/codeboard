/**
 * The ORM model for templates of project dependencies.
 *
 * This model is needed to represent the dependencies between courses, tasks and blocks.
 * We don't want Sequelize to auto-create this table by defining a M:N-dependency, because this table
 * will be enriched with more information in the future.
 *
 * todo For advanced course management:
 *  1) Order of tasks in a course
 *  2) Time Restrictions for Project within a course
 *  3) "Before task X can be solved, task Y must be solved."
 */


module.exports = function(sequelize, DataTypes) {

  var projectDependency = sequelize.define(
    'ProjectDependency',
    {
      // is empty for the moment
    }
  );

  return projectDependency;
};