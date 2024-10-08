'use strict';
let bodyParser = require('body-parser');
const Issue = require('../models/issue.model');
const Project = require('../models/project.model');

module.exports = function (app) {


  app.use("/api/issues/:project", bodyParser.urlencoded({extended: false}));

  app.route('/api/issues/:project')
  
    .get(function (req, res){
      let project = req.params.project;
      
      getIssuesPerProject(project,req, res);
    })
    
    .post(function (req, res){
      let project = req.params.project;
      let issue_title = req.body.issue_title;
      let issue_text = req.body.issue_text;
      let created_by = req.body.created_by;
      let assigned_to = req.body.assigned_to;
      let status_text = req.body.status_text;
      

      createAndSaveIssue(project, issue_title, issue_text, created_by, assigned_to, status_text, res )
    })
    
    .put(function (req, res){
      let project = req.params.project;

      const {_id, issue_title, issue_text, created_by, assigned_to, status_text } = req.body;

      const parametersToChange = { issue_title, issue_text, created_by, assigned_to, status_text};

      if (!_id) {
        res.json({ error: 'missing _id' }) 
        return;
       }
    

       findAndUpdate(_id, parametersToChange, res)
      
    })
    
    .delete(function (req, res){
      let project = req.params.project;

      const {_id } = req.body;

      console.log("attempt Delete", _id, project)
      if (!_id) {
        console.log("NO ID")
        res.json({ error: 'missing _id' })
        return
      }
         //66dc362e0ce9da13185cfda5
      if (_id.length != 24 ) {
          res.json({ error: 'could not delete', _id: _id });
          return
      }

      removeIssue(_id, project, res)
    });
    
};


var createAndSaveIssue = function(project, issue_title, issue_text, created_by, assigned_to, status_text, res ) {

  if (issue_title == null || issue_text == null || created_by == null) {
   res.json({ error: 'required field(s) missing' }) 
   return;
  }
  Project.findOne({name: project })
  .then(doc => {

    let associatedProject;


    let createdDate = new Date().toISOString();

    var newIssue = new Issue({project: project, title: issue_title, text: issue_text, created_by: created_by, created_on: createdDate, assigned_to: assigned_to, updated_on: createdDate, status_text: status_text  });

  
    newIssue.save();

    if( doc == null) {
      associatedProject = new Project({name: project, issues: [newIssue._id]})
      associatedProject.save();
    } else {
     // console.log("WE FOUND A PROJECT", newIssue._id)
      let existingIssues = doc.issues;
      existingIssues.push(newIssue._id)
      doc.issues = existingIssues;

      doc.save();
    }

    let returnedIssue = {_id: newIssue._id, issue_title: issue_title, issue_text: issue_text, created_on: newIssue.created_on, updated_on: newIssue.updated_on, created_by: newIssue.created_by, assigned_to: newIssue.assigned_to, open: newIssue.open, status_text: newIssue.status_text };

    res.json(returnedIssue);

  //  console.log(returnedIssue, "SUCCESSFUL POST")
  })
  .catch(err => {
    console.error('Error creating Issue:', err);
  });

};

const getIssuesPerProject = (projectName, req, res) => {
  const { open, created_by, issue_title, status_text, created_on, updated_on, assigned_to, _id } = req.query;

  //console.log(open, created_by, issue_title, status_text, created_on, updated_on, assigned_to, _id, "REQUEST PARAMS")

  Project.findOne({ name: projectName })
    .then(doc => {
      if (!doc) {
        return res.status(404).json({ error: 'Project not found' });
      }

      let issuePromises;

      let issueReqObject = {};
      if (open) issueReqObject.open = open;
      if (created_by) issueReqObject.created_by = created_by;
      if (status_text) issueReqObject.status_text = status_text;
      if (created_on) issueReqObject.created_on = created_on;
      if (updated_on) issueReqObject.updated_on = updated_on;
      if (assigned_to) issueReqObject.assigned_to = assigned_to
      if (issue_title) issueReqObject.title = issue_title

      if (_id) {
        issueReqObject._id =_id ;

        issuePromises = [ Issue.findOne(issueReqObject).then(issueDoc => {
          if (issueDoc) {
            return {
              //REFACTOR
              assigned_to: issueDoc.assigned_to,
              status_text: issueDoc.status_text,
              open: issueDoc.open,
              _id: _id,
              issue_title: issueDoc.title,
              issue_text: issueDoc.text,
              created_by: issueDoc.created_by,
              created_on: issueDoc.created_on,
              updated_on: issueDoc.updated_on
            };
          } else {
            return null;
          }
        }) ]
      }
      else {
          issuePromises = doc.issues.map(issueId => {
          issueReqObject._id =issueId;
          // console.log(issueReqObject, "MY ISSUE REQUEST OBJECT")
          return Issue.findOne(issueReqObject).then(issueDoc => {
            if (issueDoc) {
              //REFACTOR
              return {
                assigned_to: issueDoc.assigned_to,
                status_text: issueDoc.status_text,
                open: issueDoc.open,
                _id: issueId,
                issue_title: issueDoc.title,
                issue_text: issueDoc.text,
                created_by: issueDoc.created_by,
                created_on: issueDoc.created_on,
                updated_on: issueDoc.updated_on
              };
            } else {
              return null;
            }
          });
        });
      }

    

      Promise.all(issuePromises)
        .then(finalArr => {
          res.json(finalArr.filter(issue => issue !== null));
        })
        .catch(err => {
          console.error('Error retrieving Issues:', err);
          res.status(500).json({ error: 'Error retrieving issues' });
        });
    })
    .catch(err => {
      console.error('Error retrieving Project:', err);
      res.status(500).json({ error: 'Error retrieving project' });
    });
};


const findAndUpdate = (_id, changeParameters, res) => {

  const { issue_title, issue_text, created_by, assigned_to, status_text} = changeParameters;

  if (!issue_title && !issue_text && !created_by && !assigned_to && !status_text) {
    res.json({ error: 'no update field(s) sent', '_id': _id })
    return;
  }

  Issue.findOne({ _id: _id }, function(err, issue) {
    if (err) {
      console.error(err)
      return
    }
    if (!issue) {
      res.json({ error: 'could not update', '_id': _id })
      return
    }
    if (issue_title) issue.title = issue_title;
    if (issue_text) issue.text = issue_text;
    if (created_by) issue.created_by = created_by;
    if (assigned_to) issue.assigned_to = assigned_to;
    if (status_text) issue.status_text = status_text;
    
    let updateDate = new Date().toISOString();
    issue.updated_on = updateDate;

    issue.save(function(err, data) {
      if (err) {
        res.json({ error: 'could not update', '_id': _id })
      }
      res.json({  result: 'successfully updated', '_id': _id })
      
    });

  })
  .catch(err => {
    console.error('Error retrieving Project:', err);
    res.status(500).json({ error: 'could not update', '_id': _id });
  });
};

const removeIssue = (_id, project, res) => {
  Issue.findOneAndDelete({ _id: _id, project: project}, function(err, issue) {
    if (!issue) {
      res.json({ error: 'could not delete', _id: _id });
      return;
    }
    console.log(issue.project)
    if (err) {
      res.json({ error: 'could not delete', _id: _id });
      return;
    } 
    
      console.log("successful delete", _id)
      res.json({ result: 'successfully deleted', _id: _id });
    
  })  
  .catch(err => {
    console.error('Error retrieving Project:', err);
    res.json({ error: 'could not delete', _id: _id });
  });
};