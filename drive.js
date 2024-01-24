import { google } from "googleapis";
import fs from "fs";
import path from "path";

// Load the service account key JSON file
const serviceAccount = JSON.parse(
  fs.readFileSync("future4u-412121-9c3a9372690b.json")
);

// Authenticate a JWT client with the service account
const jwtClient = new google.auth.JWT(
  serviceAccount.client_email,
  null,
  serviceAccount.private_key,
  ["https://www.googleapis.com/auth/drive"]
);

// Use the JWT client to authenticate requests
jwtClient.authorize((error, tokens) => {
  if (error) {
    console.log("Error making request to generate access token:", error);
  } else if (tokens.access_token === null) {
    console.log(
      "Provided service account does not have permission to generate access tokens"
    );
  } else {
    const accessToken = tokens.access_token;
    const drive = google.drive({ version: "v3", auth: jwtClient });

    // Your drive operations go here

    // Example: list files
    drive.files.list({ pageSize: 10 }, (err, res) => {
      if (err) throw err;
      const files = res.data.files;
      if (files.length) {
        console.log("Files:");
        files.map((file) => {
          console.log(`${file.name} (${file.id})`);
        });
      } else {
        console.log("No files found.");
      }
    });
  }
});
