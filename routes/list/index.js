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

var router = express.Router();

/* GET list page. */
router.get('/', function(req, res, next) {
  //res.render('listPage', { title: 'List Movies' });
  console.log("response will be sent from the next function");
  next();
}, function(req, res) {
    var params = {
        TableName: config.DB_TABLENAME,
        ProjectionExpression: "meetingName, meetingDate, meetingStatus",
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

});

module.exports = router;