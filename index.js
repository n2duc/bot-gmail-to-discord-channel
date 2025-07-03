import dotenv from "dotenv";
dotenv.config();

import fs from 'fs/promises';
import path from 'path';
import process from 'process';
import {google} from 'googleapis';
import { authenticate } from '@google-cloud/local-auth';

import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const DISCORD_TOKEN = process.env.BOT_TOKEN;
const DISCORD_CHANNEL_ID = process.env.CHANNEL_ID;
const EMAIL_SENDER = process.env.EMAIL_SENDER;

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.compose', 'https://www.googleapis.com/auth/gmail.modify'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request authorization to call APIs.
 *
 * @return {Promise<OAuth2Client>}
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Checks emails from a specific sender and sends the content to a Discord channel.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function checkEmails(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  setInterval(async () => {
    try {
      const res = await gmail.users.messages.list({
        userId: 'me',
        q: `from:${EMAIL_SENDER} is:unread`, // Only check unread emails from the specified sender
        maxResults: 1,
      });
      const messages = res.data.messages;
      if (messages && messages.length) {
        for (const message of messages) {
          const msg = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
          });
          const emailContent = msg.data.snippet;
          const internalDate = msg.data.internalDate;
          const receivedTime = new Date(parseInt(internalDate)).toLocaleString();

          const headers = msg.data.payload.headers;
          const subjectHeader = headers.find(header => header.name === 'Subject');
          const emailSubject = subjectHeader ? subjectHeader.value : 'No Subject';

          const emailEmbed = new EmbedBuilder()
            .setTitle(`${emailSubject}`)
            .setDescription(emailContent)
            .setFooter({ text: `Received at ${receivedTime}` })
            .setColor('#34d399');

          sendToDiscord(emailEmbed);

          // Mark the email as read
          await gmail.users.messages.modify({
            userId: 'me',
            id: message.id,
            resource: {
              removeLabelIds: ['UNREAD'],
            },
          });
        }
      }
    } catch (error) {
      console.error('Error checking emails:', error);
    }
  }, 10000); // Check every minute
}

/**
 * Sends a message to a Discord channel.
 *
 * @param {string} message The message content to send to Discord.
 */
function sendToDiscord(embed) {
  client.channels.fetch(DISCORD_CHANNEL_ID)
    .then(channel => {
      channel.send({ embeds: [embed] });
      console.log('Email sent to Discord!');
    })
    .catch(console.error);
}


client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(client.user.id);
});

client.login(DISCORD_TOKEN);

// Authorize and start checking emails
authorize().then(checkEmails).catch(console.error);