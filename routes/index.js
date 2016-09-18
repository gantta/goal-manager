var express = require('express');
var AWS = require('aws-sdk');
var fs = require('fs');

//Read config values from a JSON file.
var config = fs.readFileSync('./app_config.json', 'utf8');
config = JSON.parse(config);

// Update the region settings
AWS.config.update({
  region: config.AWS_REGION,
  endpoint: config.ENDPOINT
});

//Create DynamoDB client and pass in region.
var dynamoDB = new AWS.DynamoDB({region: config.AWS_REGION});
var docClient = new AWS.DynamoDB.DocumentClient();
var completedCount = {};
var meetings = [];
var runOnce = true;

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('index', { title: 'Goal App' });

  if (config.MODE != "offline") {

    var params = {
      TableName: config.DB_TABLENAME,
      ProjectionExpression: "meetingName, meetingDate, meetingStatus",
      FilterExpression: "meetingStatus = :complete_status",
      ExpressionAttributeValues: {
        ":complete_status": "Complete"
      }
    };

    console.log("Scanning meetings table");
    docClient.scan(params, onScan);

    function onScan(err, data) {
      if (err) {
        console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
      } else {
        console.log("Scan succeeded. Found", data.Count, "items");
        completedCount = {
          completedCount: data.Count
        };
        var ob = JSON.stringify(completedCount, null, 2);

        res.render('index', { title: 'Goal App', json: ob });

      }
    }
  } else {
    // Offline mode will stash some fake meetings
    if (runOnce) {
      var meeting = {
        id : guid(),
        meetingName : "Test 1",
        meetingDate : "2016-16-09",
        meetingStatus : "Complete"
      };

      meetings.push(meeting);
      
      meeting = {
        id : guid(),
        meetingName : "Test 2",
        meetingDate : "2016-23-09",
        meetingStatus : "Scheduled"
      };
      
      meetings.push(meeting);

      runOnce = false;

    }
 

    completedCount = {
      completedCount: meetings.length
    };
    var ob = JSON.stringify(completedCount, null, 2);

    res.render('index', { title: 'Goal App', json: ob });


  }  
});


function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

/* Post new meeting */
router.post('/addnew', function(req, res) {
  var nameField = req.body.name,
      meetingDateField = req.body.meetingDate,
      meetingStatusField = req.body.meetingStatus,
      id = guid();

  
  // @todo: add some validation on the input fields
  
  if (config.MODE != "offline") {

    var formData = {
      TableName: config.DB_TABLENAME,
      Item: {
        id: {'S': id},
        meetingName: {'S': nameField},
        meetingDate: {'S': meetingDateField},
        meetingStatus: {'S': meetingStatusField},
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
  } else {

      var meeting = {
        id : guid(),
        meetingName : req.body.name,
        meetingDate : req.body.meetingDate,
        meetingStatus : req.body.meetingStatus
      };
      
      meetings.push(meeting);
    
      res.sendStatus(200);
  }
});

module.exports = router;
