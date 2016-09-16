var express = require('express');
var AWS = require('aws-sdk');
var fs = require('fs');

//Read config values from a JSON file.
var config = fs.readFileSync('./app_config.json', 'utf8');
config = JSON.parse(config);

//Create DynamoDB client and pass in region.
var dynamoDB = new AWS.DynamoDB({region: config.AWS_REGION});

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Goal App' });
});

/* Post new meeting */
router.post('/addnew', function(req, res) {
  var nameField = req.body.name,
      meetingDateField = req.body.meetingDate,
      meetingStatusField = req.body.meetingStatus,
      id = "create a unique here";

  
  // @todo: add some validation on the input fields
  
  var formData = {
    TableName: config.DB_TABLENAME,
    Item: {
      id: {'S': id},
      name: {'S': nameField},
      meetingDate: {'S': meetingDateField},
      status: {'S': meetingStatusField}
    }
  };


  dynamoDB.putItem(formData, function(err, data) {
    if (err) {
      console.log('Error adding item to database: ', err);
      res.sendStatus(500);
    } else {
      console.log('Form data added to database.');
      res.sendStatus(200);
    }
  });

});

module.exports = router;
