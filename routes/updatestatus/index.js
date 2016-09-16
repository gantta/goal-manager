var express = require('express');


var router = express.Router();


/* Update the meeting status */
/* Post new meeting */
router.post('/', function(req, res) {
    console.log("Beginning to update status for", req.body);

    res.sendStatus(200);
});

module.exports = router;