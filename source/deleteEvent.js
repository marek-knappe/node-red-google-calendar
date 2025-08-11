var request = require('request');
module.exports = function (RED) {
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
                url: linkUrl,
                headers: {
                    "Authorization": "Bearer " + node.google.credentials.accessToken
                }
            };
            
            request(opts, function (error, response, body) {
                if (error) {
                    msg.payload = "Error deleting event: " + error.message;
                    msg.error = error.message;
                    node.error(error, msg);
                    node.status({ fill: "red", shape: "ring", text: "calendar.status.failed" });
                    node.send(msg);
                    return;
                }
                
                // DELETE requests return 204 No Content on success
                if (response.statusCode === 204) {
                    msg.payload = "Successfully deleted event from " + calendarId;
                    msg.eventId = eventId;
                    msg.calendarId = calendarId;
                    msg.success = true;
                    node.status({ fill: "green", shape: "ring", text: "Deleted successfully" });
                } else {
                    let errorMsg = "HTTP Error: " + response.statusCode;
                    try {
                        if (body) {
                            const errorBody = JSON.parse(body);
                            if (errorBody.error && errorBody.error.message) {
                                errorMsg += " - " + errorBody.error.message;
                            }
                        }
                    } catch (e) {
                        // If we can't parse the error body, use the raw response
                        if (body) {
                            errorMsg += " - " + body;
                        }
                    }
                    
                    msg.payload = "Failed to delete event: " + errorMsg;
                    msg.error = errorMsg;
                    msg.statusCode = response.statusCode;
                    msg.success = false;
                    node.status({ fill: "red", shape: "ring", text: "Failed to delete" });
                }
                node.send(msg);
            })
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
