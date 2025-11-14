var axios = require('axios');
module.exports = function(RED) {
    "use strict";
    function addEventToCalendar(n) {
        RED.nodes.createNode(this,n);            
        this.google = RED.nodes.getNode(n.google);        
        if (!this.google || !this.google.credentials.accessToken) {
            this.warn(RED._("calendar.warn.no-credentials"));
            return;
        }
        var calendarId = n.calendarId2 || ""
        var node = this;

        node.on('input', function(msg) {
            // Support both direct msg properties and msg.payload properties
            const payload = msg.payload || {};
            
            calendarId = msg.calendarId? msg.calendarId : calendarId
            n.title = payload.summary || msg.summary || msg.title || msg.tittle || n.title || n.tittle
            n.description = payload.description || msg.description || n.description
            n.colorId = payload.colorId || msg.colorId || n.colorId
            n.location = payload.location || msg.location || n.location
            n.arrAttend = msg.arrAttend ? msg.arrAttend : n.arrAttend ? n.arrAttend : []
            n.conference = msg.conference ? msg.conference : n.conference
            n.iCalUID = payload.iCalUID || msg.iCalUID || n.iCalUID
            var timeStart; 
            var timeEnd;
            let timezone = msg.timezone ? msg.timezone : n.timezone
                timeStart= payload.start || msg.start || n.time.split(" - ")[0];
                timeEnd= payload.end || msg.end || n.time.split(" - ")[1];
             timeStart += `${timezone}`;
             timeEnd += `${timezone}`;

            var arrAttend = [];     
            if (n.arrAttend.length===0){   
            if (n.attend > 0) {
                for (let index = 1; index < parseInt(n.attend) + 1; index++) {
                    if(n["email" + index] || n["name" + index]) {
                        if (validateEmail(n["email" + index])) {
                            arrAttend.push({
                                email: n["email" + index] || '',
                                displayName: n["name" + index] || ''
                            })             
                        }
                    }
                }            
            }         
        }        else { arrAttend = n.arrAttend}
        
        const conferenceData = {
            createRequest: {requestId: requestIdGenerator()}
        };
          
        var api = 'https://www.googleapis.com/calendar/v3/calendars/';        
        var newObj = {
            summary: n.title,
            description: n.description,
            location: n.location,
            start: {dateTime: new Date(timeStart)},
            end: {dateTime: new Date(timeEnd)},
            attendees: arrAttend
        };

            if (n.colorId){
                newObj.colorId = n.colorId;
            }
            if (n.conference){
                newObj.conferenceData = conferenceData;
            }
            if (n.iCalUID){
                newObj.iCalUID = n.iCalUID;
            }
            var linkUrl = api + encodeURIComponent(calendarId) + '/events?conferenceDataVersion=1'
            var opts = {
                method: "POST",
                url: linkUrl,
                headers: {
                    "Content-Type": "application/json"
                },
                data: newObj
            };
            
            // Use the google request method which handles token refresh automatically
            node.google.request(opts, function(err, responseData) {
                if (err) {
                    msg.payload = "Error adding event: " + err.message;
                    msg.error = err.message;
                    node.error(err, msg);
                    node.status({fill:"red",shape:"ring",text:"calendar.status.failed"});
                    node.send(msg);
                    return;
                }
                
                if (responseData.kind == "calendar#event") {
                    msg.payload = `Successfully added event to ${calendarId}. ${responseData.hangoutLink ? `Link for Meet: ${responseData.hangoutLink}`: ""}`;
                    msg.meetLink = responseData.hangoutLink ? responseData.hangoutLink : null;
                    msg.eventLink = responseData.htmlLink ? responseData.htmlLink : null;
                    msg.eventId = responseData.id;
                    msg.success = true;
                    node.status({ fill: "green", shape: "ring", text: "Added successfully" });
                } else {
                    msg.payload = "Failed to add event: Invalid response format";
                    msg.error = "Invalid response format";
                    msg.success = false;
                    node.status({ fill: "red", shape: "ring", text: "Failed to add" });
                }
                
                node.send(msg);
            });
        });
    }
    RED.nodes.registerType("addEventToCalendar", addEventToCalendar);

    function validateEmail(email) {
        var re = /\S+@\S+\.\S+/;
        return re.test(email);
    }

    function requestIdGenerator(){
        return (Math.random() + 1).toString(36);
    }

    RED.httpAdmin.get('/cal', function(req, res) {              
        var googleId = res.socket.parser.incoming._parsedUrl.path.split("id=")[1];        
        RED.nodes.getNode(googleId).request('https://www.googleapis.com/calendar/v3/users/me/calendarList', function(err, data) {
            if(err) return;

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
            arrCalendar.forEach(function(element) {
                arrData.push(element)
            })           
            res.json(arrData)            
        })
    })
};
