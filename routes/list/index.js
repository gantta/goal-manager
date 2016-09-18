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
//var dynamoDB = new AWS.DynamoDB({region: config.AWS_REGION});
var docClient = new AWS.DynamoDB.DocumentClient();
var allMeetings = [];
var meetingDetail = {};
var meetings = [];
var runOnce = true;

var router = express.Router();

/* GET list page. */
router.get('/', function(req, res, next) {
  //res.render('listPage', { title: 'List Movies' });
  console.log("response will be sent from the next function");
  next();
}, function(req, res) {

    if (config.MODE != "offline") {
        var params = {
            TableName: config.DB_TABLENAME,
            ProjectionExpression: "id, meetingName, meetingDate, meetingStatus",
            FilterExpression: "meetingStatus = :scheduled_status or meetingStatus = :complete_status",
            ExpressionAttributeValues: {
                ":scheduled_status": "Scheduled",
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
                allMeetings.length = 0;
                data.Items.forEach(function(meeting) {
                    /*
                    console.log(
                        meeting.meetingName + ": ",
                        meeting.meetingDate, " - Status: ", meeting.meetingStatus
                    );
                    */
                    meetingDetail = {
                        meetingID : meeting.id,
                        meetingName : meeting.meetingName,
                        meetingDate : meeting.meetingDate,
                        meetingStatus : meeting.meetingStatus
                    };
                    allMeetings.push(meetingDetail);
                    
                });

                if (typeof data.LastEvaluatedKey != "undefined") {
                    console.log("Scanning for more");
                    params.ExclusiveStartKey = data.LastEvaluatedKey;
                    docClient.scan(params, onScan);
                }

                var ob = JSON.stringify(allMeetings, null, 2);
                //console.log(ob);

                res.render('list', { title: 'Goal App | My Meetings', json : ob } );

            }

        }


    } else {

        allMeetings.length = 0;

        meetingDetail = {
            id : guid(),
            meetingName : "Test 1",
            meetingDate : "2016-16-09",
            meetingStatus : "Complete"
        };
        allMeetings.push(meetingDetail);

      meetingDetail = {
        id : guid(),
        meetingName : "Test 2",
        meetingDate : "2016-23-09",
        meetingStatus : "Scheduled"
      };
      
      allMeetings.push(meetingDetail);


        var ob = JSON.stringify(allMeetings, null, 2);
        //console.log(ob);

        res.render('list', { title: 'Goal App | My Meetings', json : ob } );
        
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

/* Update the meeting status */
/* Post new meeting */
router.post('/updatestatus', function(req, res) {
    console.log("Beginning to update status for", req);
});

module.exports = router;