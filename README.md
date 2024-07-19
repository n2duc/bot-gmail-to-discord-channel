# Gmail to Discord Bot

A Node.js application that retrieves emails from a specified Gmail account and sends the content to a Discord channel.

## Features

- Checks Gmail for new emails from a specific sender.
- Sends the email content and received time to a specified Discord channel.
- Marks the emails as read after processing.

## Prerequisites

- Node.js (version 14 or later)
- A Google Cloud project with the Gmail API enabled
- Discord bot token
- OAuth 2.0 credentials for the Google Cloud project

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/n2duc/bot-gmail-to-discord-channel.git
cd bot-gmail-to-discord-channel

```

### 2. Install dependencies

```bash
npm install
```

### 3. Create and configure .env file

```makefile
BOT_TOKEN = 
SERVER_ID = 
CHANNEL_ID = 
EMAIL_SENDER = 
```

### 4. Configure Google OAuth 2.0 credentials

- Go to the [Google Cloud Console](https://console.cloud.google.com/).
- Create a new project or select an existing one.
- Enable the Gmail API for your project.
- Create OAuth 2.0 credentials and download the credentials.json file.
- Place the credentials.json file in the root of your project directory.

### 5. Run the application

```bash
npm start

or

npm run dev (development environment)
```

The application will prompt you to visit a URL for authorization. Follow the URL, authorize the application, and enter the authorization code.