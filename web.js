var express = require('express');
var request = require('request');

var app = express.createServer(express.logger());

app.get('/', function(req, res) {
  res.send('I\'m still working!');
});

// Begin Crashlytics web hook call
// See http://support.crashlytics.com/knowledgebase/articles/102391-how-do-i-configure-a-custom-web-hook-

app.post('/', express.bodyParser(), function(req, res) {
  if (req.body.event == "verification") {
    // Crashlytics is making sure we're actually a web hook
    // Say yes
    res.send(200);
  }
  else if (req.body.event == "issue_impact_change" && req.body.payload_type == "issue") {
    // We're being notified of an issue

    // Build the issue payload
    var issue_data = JSON.stringify({
      title: req.body.payload.title + " (Crashlytics #" + req.body.payload.display_id + ")",
      body: "**Location:** " + req.body.payload.title + "\n**Method**: `" + req.body.payload.method + "`\n**Impact Level**: " + req.body.payload.impact_level + "\n**Occurences**: " + req.body.payload.crashes_count + "\n**Impacted Devices**: " + req.body.payload.impacted_devices_count + "\n\n[Crashlytics Report](" + req.body.payload.url + ")",
      labels: ["crash"]
    });

    // Create an issue in Github
    request.post({
      uri: 'https://api.github.com/repos/' + (process.env.ORGANIZATION || process.env.USER) + '/' + process.env.REPO + '/issues',
      body: issue_data,
      auth: {
        'user' : process.env.USER,
        'pass' : process.env.PASS
      }
    });

    res.send(200);
  }
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
