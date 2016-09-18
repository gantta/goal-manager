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

var docClient = new AWS.DynamoDB.DocumentClient()
var allMeetings = [];
var meetingDetail = {};

var router = express.Router();


/* Update the meeting status */

router.get('/', function(req, res) {
    console.log("Jumping into the update status");

    var str = req.url;
    var arr = str.split("?");
    var meetingID = arr[1];
    meetingID = meetingID.replace("meetingID=", "");
    var meetingStatus = arr[2];
    meetingStatus = meetingStatus.replace("currentStatus=", "");
    var newMeetingStatus = "";
    if (meetingStatus == "Scheduled") {
        newMeetingStatus = "Complete";
    } else {
        newMeetingStatus = "Scheduled";
    };

    // Update the meeting
    var params = {
        TableName: config.DB_TABLENAME,
        Key:{
            "id": meetingID
        },
        UpdateExpression: "set meetingStatus = :s",
        ExpressionAttributeValues:{
            ":s": newMeetingStatus
        },
        ReturnValues:"UPDATED_NEW"
    };

    console.log("Updating the item...");
    docClient.update(params, function(err, data) {
        if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
            res.sendStatus(500);
        } else {
            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));

            params = {
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
        }
    });

});

module.exports = router;