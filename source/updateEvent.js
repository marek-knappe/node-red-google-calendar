//PATCH https://www.googleapis.com/calendar/v3/calendars/calendarId/events/eventId
// calendarId
// eventId
// description
// sendUpdates=all
var axios = require('axios');
module.exports = function(RED) {
    "use strict";
    function updateEventAtCalendar(n) {
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
                description = n.description || msg.description || "",
                title = n.title || msg.title || "",
                location = n.location || msg.location || "",
                emailNotify = n.emailNotify || msg.emailNotify ? "?sendUpdates=all" : "";
                n.conference = msg.conference ? msg.conference : n.conference
                const confecerceCreate = `${emailNotify.length>0 ? '&' : '?'}conferenceDataVersion=1`;
            if( !eventId || !calendarId ) {
                node.status({ fill: "red", shape: "ring", text: "Please specify eventId and calendarId" });
                return;
            }

            const conferenceData = {
                createRequest: {requestId: requestIdGenerator()}
            }

          
            let baseApi = 'https://www.googleapis.com/calendar/v3/calendars/';
            let patchObj = {
                summary: title,
                description: description,
                location: location
            }
            if (n.conference){
                patchObj.conferenceData = conferenceData;
            }

            //remove empty fields
            Object.keys(patchObj).forEach(key => patchObj[key] === '' && delete patchObj[key]);
            
            if (!Object.keys(patchObj).length) {
                node.status({ fill: "red", shape: "ring", text: "No param specified" });
                return;
            }

            var linkUrl = baseApi + encodeURIComponent(calendarId) + '/events/' + eventId + emailNotify + confecerceCreate;
            var opts = {
                method: "PATCH",
                url: linkUrl,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + node.google.credentials.accessToken
                },
                body: JSON.stringify(patchObj)
            };
            
            axios(opts)
                .then(response => {
                    if (response.data.kind == "calendar#event") {
                        msg.payload = "Successfully updated event of " + calendarId;
                        msg.meetLink = response.data.hangoutLink ? response.data.hangoutLink : null;
                        msg.eventLink = response.data.htmlLink ? response.data.htmlLink : null;
                        msg.thisEventId = response.data.id;
                        msg.success = true;
                        node.status({ fill: "green", shape: "ring", text: "Update successfully" });
                    } else {
                        msg.payload = "Failed to update event: Invalid response format";
                        msg.error = "Invalid response format";
                        msg.success = false;
                        node.status({ fill: "red", shape: "ring", text: "Failed to update" });
                    }
                    node.send(msg);
                })
                .catch(error => {
                    msg.payload = "Error updating event: " + error.message;
                    msg.error = error.message;
                    node.error(error, msg);
                    node.status({ fill: "red", shape: "ring", text: "calendar.status.failed" });
                    node.send(msg);
                });
        });
    }

    function requestIdGenerator(){
        return (Math.random() + 1).toString(36);
    }

    RED.nodes.registerType("updateEventAtCalendar", updateEventAtCalendar);

    RED.httpAdmin.get('/get-calendar-list', function (req, res) {
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
