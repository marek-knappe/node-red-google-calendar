var axios = require('axios');
module.exports = function(RED) {
    "use strict";
    function deleteEventFromCalendar(n) {
        RED.nodes.createNode(this, n);
        this.google = RED.nodes.getNode(n.google);
        if (!this.google || !this.google.credentials.accessToken) {
            this.warn(RED._("calendar.warn.no-credentials"));
            return;
        }

        var node = this;

        node.on('input', function (msg) {
            let calendarId = n.calendarId || msg.calendarId || "",
                eventId = n.eventId || msg.eventId || "",
                emailNotify = n.emailNotify || msg.emailNotify ? "?sendUpdates=all" : "";

            if (!eventId || !calendarId) {
                node.status({ fill: "red", shape: "ring", text: "Please specify eventId and calendarId" });
                return;
            }

            let baseApi = 'https://www.googleapis.com/calendar/v3/calendars/';
            var linkUrl = baseApi + encodeURIComponent(calendarId) + '/events/' + eventId + emailNotify;
            var opts = {
                method: "DELETE",
                url: linkUrl
            };
            
            // Use the google request method which handles token refresh automatically
            node.google.request(opts, function(err, responseData) {
                if (err) {
                    msg.payload = "Error deleting event: " + err.message;
                    msg.error = err.message;
                    node.error(err, msg);
                    node.status({ fill: "red", shape: "ring", text: "calendar.status.failed" });
                    node.send(msg);
                    return;
                }
                
                // DELETE requests return 204 No Content on success
                if (responseData === null || responseData === undefined) {
                    msg.payload = "Successfully deleted event from " + calendarId;
                    msg.eventId = eventId;
                    msg.calendarId = calendarId;
                    msg.success = true;
                    node.status({ fill: "green", shape: "ring", text: "Deleted successfully" });
                } else {
                    msg.payload = "Failed to delete event: " + (responseData.error ? responseData.error.message : "Unknown error");
                    msg.error = responseData.error ? responseData.error.message : "Unknown error";
                    msg.success = false;
                    node.status({ fill: "red", shape: "ring", text: "Failed to delete" });
                }
                node.send(msg);
            });
        });
    }

    RED.nodes.registerType("deleteEventFromCalendar", deleteEventFromCalendar);

    RED.httpAdmin.get('/cal-delete', function (req, res) {
        var googleId = req.query.id;

        RED.nodes.getNode(googleId).request('https://www.googleapis.com/calendar/v3/users/me/calendarList', function (err, data) {
            if (err) return;

            var primary = "";
            var arrCalendar = [];

            for (var i = 0; i < data.items.length; i++) {
                var cal = data.items[i];
                if (cal.primary) {
                    primary = cal.id;
                } else {
                    arrCalendar.push(cal.id)
                }
            }

            var arrData = [];
            arrData.push(primary);
            arrCalendar.sort();
            arrCalendar.forEach(function (element) {
                arrData.push(element)
            })
            res.json(arrData)
        })
    })
};
