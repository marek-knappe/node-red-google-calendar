# Node-RED Google Calendar Enhanced

[![npm version](https://badge.fury.io/js/%40marek-knappe%2Fnode-red-google-calendar.svg)](https://badge.fury.io/js/%40marek-knappe%2Fnode-red-google-calendar)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Node-RED](https://img.shields.io/badge/Node--RED-3.1.9+-green.svg)](https://nodered.org/)

Enhanced Google Calendar nodes for Node-RED with improved error handling, event links, delete functionality, and robust OAuth2 authentication.

> **Note**: This package is based on the original work by [@platmac/node-red-google-calendar](https://github.com/PlatmaC/node-red-google-calendar) with significant improvements and enhancements.

## ✨ Features

- **📅 Complete Calendar Operations**: Create, read, update, and delete Google Calendar events
- **🔗 Event Links**: Direct links to calendar events and Google Meet video calls
- **🛡️ Robust Error Handling**: Comprehensive error responses with detailed debugging information
- **🔐 Enhanced Authentication**: Improved OAuth2 token refresh and management
- **📧 Attendee Management**: Support for event attendees and notifications
- **🎥 Google Meet Integration**: Automatic conference creation with video links
- **🌍 Timezone Support**: Proper timezone handling for global events

## 🚀 What's New in v3.0.1

- **NEW**: `deleteEvent` node for removing calendar events
- **IMPROVED**: Enhanced error handling across all modules
- **FIXED**: OAuth2 token refresh issues causing 401 errors
- **ADDED**: Event links (EventLink and MeetLink) in all responses
- **ENHANCED**: Proactive token management with expiry buffering

## 📦 Installation

### Via Node-RED Palette Manager (Recommended)
1. Open Node-RED
2. Go to **Manage Palette** → **Install**
3. Search for `@marek-knappe/node-red-google-calendar`
4. Click **Install**

### Via npm
```bash
npm install @marek-knappe/node-red-google-calendar
```

## 🔧 Setup & Configuration

### 1. Google Calendar API Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Google Calendar API**
   - Go to **APIs & Services** → **Library**
   - Search for "Google Calendar API"
   - Click **Enable**

3. **Create OAuth 2.0 Credentials**
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth 2.0 Client IDs**
   - Choose **Web application**
   - Add authorized redirect URIs (shown in Node-RED)

### 2. Node-RED Configuration

1. **Add Calendar Node**
   - Drag any Google Calendar node to your flow
   - Click **Edit** on the Google Account field

2. **Enter Credentials**
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console

3. **Authenticate**
   - Click **Authenticate with Google**
   - Grant permissions in browser
   - Click **Add** to complete setup

## 📋 Available Nodes

### 🔍 Get Event
Retrieves events from Google Calendar within a specified time range.

**Input Properties:**
- `msg.payload.timemin` - Start time (e.g., "2024-01-01 09:00:00")
- `msg.payload.timemax` - End time (e.g., "2024-01-01 17:00:00")
- `msg.calendarId` - Calendar ID (e.g., "user@gmail.com")

**Output Properties:**
- `msg.payload` - Array of event objects
- `msg.eventId` - Event identifier
- `msg.calendarId` - Calendar ID
- `msg.start` - Event start time
- `msg.end` - Event end time
- `msg.title` - Event title
- `msg.attendees` - List of attendees
- `msg.EventLink` - Direct link to calendar event
- `msg.MeetLink` - Google Meet video call link

### ➕ Add Event
Creates new events in Google Calendar.

**Input Properties:**
- `msg.calendarId` - Target calendar ID
- `msg.title` - Event title
- `msg.description` - Event description
- `msg.location` - Event location
- `msg.start` - Start time
- `msg.end` - End time
- `msg.timezone` - Timezone offset
- `msg.conference` - Enable Google Meet

**Output Properties:**
- `msg.payload` - Success/Error message
- `msg.eventId` - Created event ID
- `msg.meetLink` - Google Meet link (if enabled)
- `msg.eventLink` - Direct calendar event link
- `msg.success` - Boolean success flag

### ✏️ Update Event
Modifies existing calendar events.

**Input Properties:**
- `msg.calendarId` - Calendar ID
- `msg.eventId` - Event ID to update
- `msg.title` - New title
- `msg.description` - New description
- `msg.location` - New location
- `msg.conference` - Enable/disable Google Meet
- `msg.emailNotify` - Notify attendees of changes

**Output Properties:**
- `msg.payload` - Success/Error message
- `msg.thisEventId` - Updated event ID
- `msg.meetLink` - Google Meet link
- `msg.eventLink` - Direct calendar event link
- `msg.success` - Boolean success flag

### 🗑️ Delete Event
Removes events from Google Calendar.

**Input Properties:**
- `msg.calendarId` - Calendar ID
- `msg.eventId` - Event ID to delete
- `msg.emailNotify` - Notify attendees of deletion

**Output Properties:**
- `msg.payload` - Success/Error message
- `msg.eventId` - Deleted event ID
- `msg.calendarId` - Calendar ID
- `msg.success` - Boolean success flag

## 💡 Use Cases

### 🤖 Automated Meeting Reminders
```javascript
// Get upcoming meetings and send reminders
const events = await getEvents({ timemin: "now", timemax: "+1h" });
events.forEach(event => {
    if (event.attendees.length > 0) {
        sendReminder(event.title, event.EventLink, event.attendees);
    }
});
```

### 🏢 Room Booking System
```javascript
// Check room availability and book
const availability = await getEvents({ 
    calendarId: "room@company.com",
    timemin: "2024-01-15 09:00:00",
    timemax: "2024-01-15 10:00:00"
});

if (availability.length === 0) {
    await addEvent({
        calendarId: "room@company.com",
        title: "Team Meeting",
        start: "2024-01-15 09:00:00",
        end: "2024-01-15 10:00:00"
    });
}
```

### 📅 Daily Agenda Notifications
```javascript
// Send daily agenda to team
const today = new Date().toISOString().split('T')[0];
const agenda = await getEvents({
    timemin: today + " 00:00:00",
    timemax: today + " 23:59:59"
});

const agendaText = agenda.map(event => 
    `${event.start} - ${event.title}`
).join('\n');

sendNotification("Today's Agenda", agendaText);
```

### 🏠 Smart Home Integration
```javascript
// Trigger home automation based on calendar events
const events = await getEvents({ timemin: "now", timemax: "+30m" });
events.forEach(event => {
    if (event.title.includes("Meeting")) {
        turnOnLights();
        adjustThermostat();
        sendNotification("Meeting starting soon", event.EventLink);
    }
});
```

## 🔍 Error Handling

All nodes provide comprehensive error handling with consistent response formats:

```javascript
// Success response
{
    payload: "Successfully added event to calendar",
    success: true,
    eventId: "abc123",
    eventLink: "https://calendar.google.com/event/...",
    meetLink: "https://meet.google.com/..."
}

// Error response
{
    payload: "Failed to add event: HTTP Error: 400 - Invalid request",
    success: false,
    error: "HTTP Error: 400 - Invalid request",
    statusCode: 400
}
```

## 🛠️ Troubleshooting

### Common Issues

**401 Authentication Error**
- Tokens automatically refresh every 5 minutes
- Check Google Cloud Console credentials
- Ensure Calendar API is enabled

**Calendar Not Found**
- Verify calendar ID format
- Check calendar sharing permissions
- Ensure OAuth scope includes calendar access

**Event Creation Fails**
- Validate date/time formats
- Check required fields (title, start, end)
- Verify calendar write permissions

### Debug Mode
Enable detailed logging in Node-RED settings to troubleshoot issues.

## 📚 Examples

See the `examples/` folder for complete flow examples and screenshots.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Original Work**: Based on [@platmac/node-red-google-calendar](https://github.com/PlatmaC/node-red-google-calendar) by Hooke Jr.
- **Enhancements**: Significant improvements by Marek Knappe
- **Community**: Node-RED community for feedback and testing

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/marek-knappe/node-red-google-calendar/issues)
- **Documentation**: [GitHub Wiki](https://github.com/marek-knappe/node-red-google-calendar/wiki)
- **Email**: marek.knappe@gmail.com

---

**Made with ❤️ for the Node-RED community**