const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);



suite('Functional Tests', function() {
    this.timeout(5000);
    const randomNumber = Math.floor(Math.random() * 1000) + 1;
    const issue_title = "test_title" + randomNumber;
    const issue_text = "test_text" + randomNumber;
    const created_by = "test_created_by" + randomNumber;
    const assigned_to = "test_assigned_to" + randomNumber;
    const status_text = "test_status_text" + randomNumber;

    test('Create an issue with every field: POST request to /api/issues/{project}', function (done) {
        chai
          .request(server)
          .keepOpen()
          .post('/api/issues/apitest')
          .send({
            "issue_title": issue_title,
            "issue_text": issue_text,
            "created_by" : created_by,
            "assigned_to" : assigned_to,
            "status_text" : status_text
          })
          .end(function (err, res) {
            assert.equal(res.type,'application/json');
            assert.equal(res.body.issue_title, issue_title);
            assert.equal(res.body.issue_text,issue_text);
            assert.equal(res.body.created_by, created_by);
            assert.equal(res.body.assigned_to, assigned_to);
            assert.equal(res.body.status_text, status_text);
            done();
          });
      });

      test('Create an issue with only required fields: POST request to /api/issues/{project}', function (done) {
        chai
          .request(server)
          .keepOpen()
          .post('/api/issues/apitest')
          .send({
            "issue_title": issue_title,
            "issue_text": issue_text,
            "created_by" : created_by,
          })
          .end(function (err, res) {
            assert.equal(res.type,'application/json');
            assert.equal(res.body.issue_title, issue_title);
            assert.equal(res.body.issue_text,issue_text);
            assert.equal(res.body.created_by, created_by);
            assert.equal(res.body.assigned_to, "");
            assert.equal(res.body.status_text, "");
            done();
          });
      });

      test('Create an issue with missing required fields: POST request to /api/issues/{project}', function (done) {
        chai
          .request(server)
          .keepOpen()
          .post('/api/issues/apitest')
          .send({
            "issue_title": issue_title,
          })
          .end(function (err, res) {
            assert.equal(res.type,'application/json');
            assert.equal(res.body.error, 'required field(s) missing');
            done();
          });
      });

      test('View issues on a project: GET request to /api/issues/{project}', function (done) {
        chai
          .request(server)
          .keepOpen()
          .get('/api/issues/apitest')
          .end(function (err, res) {
            const matchingIssue = res.body.filter(issue => issue.issue_title == issue_title);
            assert.equal(res.type,'application/json');
            assert.isAtLeast(res.body.length, 1);
            assert.isAtLeast(matchingIssue.length, 1);
            done();
          });
      });

      test('View issues on a project with one filter: GET request to /api/issues/{project}', function (done) {
        chai
          .request(server)
          .keepOpen()
          .get(`/api/issues/apitest?issue_title=${issue_title}`)
          .end(function (err, res) {
            const matchingIssue = res.body.filter(issue => issue.issue_title == issue_title);
            assert.equal(res.type,'application/json');
            assert.isAtLeast(res.body.length, 1);
            assert.isAtLeast(matchingIssue.length, 1);
            done();
          });
      });

      test('View issues on a project with multiple filters: GET request to /api/issues/{project}', function (done) {
        chai
          .request(server)
          .keepOpen()
          .get(`/api/issues/apitest?issue_title=${issue_title}&status_text=${status_text}`)
          .end(function (err, res) {
            const matchingIssue = res.body.filter(issue => issue.issue_title == issue_title && issue.status_text == status_text);
            assert.equal(res.type,'application/json');
            assert.isAtLeast(res.body.length, 1);
            assert.isAtLeast(matchingIssue.length, 1);
            done();
          });
      });

      test('Update one field on an issue: PUT request to /api/issues/{project}', function (done) {
        let request_id;
        chai
          .request(server)
          .keepOpen()
          .get(`/api/issues/apitest?issue_title=${issue_title}`)
          .end(function (err, res) {
            if (err) {
              done(err);
              return;
            }
            request_id = res.body[0]._id;
      
            chai
              .request(server)
              .keepOpen()
              .put('/api/issues/apitest')
              .send({
                "issue_title": issue_title,
                "_id": request_id
              })
              .end(function (err, res) {
                if (err) {
                  done(err);
                  return;
                }
                assert.equal(res.type, 'application/json');
                assert.equal(res.body.result, 'successfully updated');
                assert.equal(res.body._id, request_id);
                done();
              });
          });
      });

      test('Update multiple fields on an issue: PUT request to /api/issues/{project}', function (done) {
        let request_id;
        chai
          .request(server)
          .keepOpen()
          .get(`/api/issues/apitest?status_text=${status_text}`)
          .end(function (err, res) {
            if (err) {
              done(err);
              return;
            }
            request_id = res.body[0]._id;
      
            chai
              .request(server)
              .keepOpen()
              .put('/api/issues/apitest')
              .send({
                "issue_title": issue_title,
                "issue_text": "updated_test_text",
                "_id": request_id
              })
              .end(function (err, res) {
                if (err) {
                  done(err);
                  return;
                }
                console.log(request_id);
                assert.equal(res.type, 'application/json');
                assert.equal(res.body.result, 'successfully updated');
                assert.equal(res.body._id, request_id);
                done();
              });
          });
      });

      test('Update an issue with missing _id: PUT request to /api/issues/{project}', function (done) {
        chai
          .request(server)
          .keepOpen()
          .put('/api/issues/apitest')
          .send({
            "issue_title": "NEW_ISSUE_TITLE",
          })
          .end(function (err, res) {
            assert.equal(res.type,'application/json');
            assert.equal(res.body.error, 'missing _id');
            done();
          });
      });

     

      test('Update an issue with no fields to update: PUT request to /api/issues/{project}', function (done) {
        let request_id;
        chai
          .request(server)
          .keepOpen()
          .get(`/api/issues/apitest?issue_title=${issue_title}&status_text=${status_text}`)
          .end(function (err, res) {
            if (err) {
              done(err);
              return;
            }
            request_id = res.body[0]._id;
      
            chai
              .request(server)
              .keepOpen()
              .put('/api/issues/apitest')
              .send({
                "_id": request_id
              })
              .end(function (err, res) {
                if (err) {
                  done(err);
                  return;
                }
                console.log(request_id);
                assert.equal(res.type, 'application/json');
                assert.equal(res.body.error, 'no update field(s) sent');
                done();
              });
          });
      });

      test('Update an issue with an invalid _id: PUT request to /api/issues/{project}', function (done) {
        chai
          .request(server)
          .keepOpen()
          .put('/api/issues/apitest')
          .send({
            "_id": "123",
            "issue_title": "NEW_ISSUE_TITLE",
          })
          .end(function (err, res) {
            assert.equal(res.type,'application/json');
            assert.equal(res.body.error, 'could not update');
            done();
          });
      });

      test('Delete an issue: DELETE request to /api/issues/{project}', function (done) {

        let request_id;
        chai
          .request(server)
          .keepOpen()
          .get(`/api/issues/apitest?status_text=${status_text}`)
          .end(function (err, res) {
            if (err) {
              done(err);
              return;
            }
            request_id = res.body[0]._id;
            console.log(request_id, "MY DELETE REQUEST");

            chai
            .request(server)
            .keepOpen()
            .delete('/api/issues/apitest')
            .send({
              "_id": request_id,
            })
            .end(function (err, res) {
              assert.equal(res.type,'application/json');
              assert.equal(res.body.result, 'successfully deleted');
              done();
            });
      
          });

      });

      test('Delete an issue with an invalid _id: DELETE request to /api/issues/{project}', function (done) {
        chai
          .request(server)
          .keepOpen()
          .delete('/api/issues/apitest')
          .send({
            "_id": "123",
          })
          .end(function (err, res) {
            assert.equal(res.type,'application/json');
            assert.equal(res.body.error, 'could not delete');
            done();
          });
      });

      test('Delete an issue with missing _id: DELETE request to /api/issues/{project}', function (done) {
        chai
          .request(server)
          .keepOpen()
          .delete('/api/issues/apitest')
          .end(function (err, res) {
            assert.equal(res.type,'application/json');
            assert.equal(res.body.error, 'missing _id');
            done();
          });
      });
      
  
});



//let returnedIssue = {_id: newIssue._id, issue_title: issue_title, issue_text: issue_text, created_on: newIssue.created_on, updated_on: newIssue.updated_on, created_by: newIssue.created_by, assigned_to: newIssue.assigned_to, open: newIssue.open, status_text: newIssue.status_text };
