import express from "express";
import multer from "multer";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import OpenAI from "openai";
import { google } from "googleapis";
import fs from "fs";
import cors from "cors";
import stream from "stream";
import path from "path";
import bodyParser from "body-parser";
import sharp from "sharp";
import axios from "axios";
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

dotenv.config();

const apiKey = process.env["OPENAI_API_KEY"];
const openai = new OpenAI({ apiKey });

const port = 8000;
const upload = multer();
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Load the service account key JSON file
const serviceAccount = JSON.parse(
  fs.readFileSync("future4u-412121-9c3a9372690b.json")
);
const jwtClient = new google.auth.JWT(
  serviceAccount.client_email,
  null,
  serviceAccount.private_key,
  ["https://www.googleapis.com/auth/drive"]
);

// Initialize the Google Drive API client
const drive = google.drive({ version: "v3", auth: jwtClient });

const csvFilePath = path.join(__dirname, "FutureSelfie-New-Data.csv"); // Define the path for the CSV file

const savetocsv = async (
  firstName,
  email,
  mainScene,
  location,
  mainCharacter,
  additionalCharacters,
  additionalInfo,
  imageCopy,
  imageUrl,
  Organization
) => {
  const headers =
    "First Name,Email,Main Scene,Location,Main Character,Additional Characters,Additional Info,Image Copy,Image Link,Organization\n";
  const data = `${firstName},${email},${mainScene},${location},${mainCharacter},${additionalCharacters},${additionalInfo},${imageCopy},${imageUrl},${Organization}\n`;

  try {
    await fs.promises.access(csvFilePath, fs.constants.F_OK);
    console.log("CSV file exists. Appending data.");
    await fs.promises.appendFile(csvFilePath, data);
    console.log("Data appended to CSV file successfully.");
  } catch (error) {
    console.log("CSV file does not exist. Creating file.", error);
    await fs.promises.writeFile(csvFilePath, headers + data);
    console.log("CSV file created with headers and data.");
  }
};
const addTextToImage = async (imageBuffer, text) => {
  // Define the text attributes
  const svgText = `
      <svg width="1024" height="1024">
        <style>
          .title { fill: #fff; font-size: 24px; font-family: Arial, sans-serif; }
        </style>
        <text x="10" y="1014" class="title">${text}</text>
      </svg>
    `;

  // Overlay the text onto the image using sharp
  return sharp(imageBuffer)
    .composite([
      {
        input: Buffer.from(svgText),
        top: 0,
        left: 0,
        gravity: "southeast", // Position the text at the bottom right
      },
    ])
    .toBuffer();
};

const handleCSVOnGoogleDrive = async (csvFilePath) => {
  const fileName = "FutureSelfie-New-Data.csv";
  const folderId = process.env.GOOGLE_FOLDER_ID;
  console.log("Uploading CSV to Google Drive. Folder ID:", folderId);

  try {
    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType: "text/csv",
      body: fs.createReadStream(csvFilePath),
    };

    // Check if the file already exists
    const existingFiles = await drive.files.list({
      q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
      spaces: "drive",
      fields: "files(id, name)",
    });

    if (existingFiles.data.files.length > 0) {
      // File exists, update it
      const fileId = existingFiles.data.files[0].id;
      await drive.files.update({
        fileId: fileId,
        media: media,
      });
      console.log(`Updated existing file on Google Drive with ID: ${fileId}`);
    } else {
      // File doesn't exist, upload as new
      await drive.files.create({
        resource: fileMetadata,
        media: media,
      });
      console.log("Uploaded new file to Google Drive.");
    }
  } catch (error) {
    console.error("Error uploading CSV to Google Drive:", error);
  }
};

app.post("/generate-images", upload.none(), async (req, res) => {
  console.log("data recieved:", req.body);
  try {
    const {
      firstName,
      email,
      mainScene,
      location,
      mainCharacter,
      additionalCharacters,
      additionalInfo,
      imageCopy,
      Organization,
    } = req.body;

    const prompt = `Create a cinematic still in 32k resolution and landscape format depicting ${mainScene}, located at ${location}. The main character is ${mainCharacter}. Additional characters include ${additionalCharacters}. ${additionalInfo}`;

    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1, // Number of images to generate
      size: "1792x1024", // Size of the image (can be adjusted as needed)
    });

    console.log("Generated image data:", imageResponse.data);
    const imageUrl = imageResponse.data[0].url;

    // Download the generated image
    const response = await axios({
      method: "GET",
      url: imageUrl,
      responseType: "arraybuffer",
    });

    const generatedImageBuffer = Buffer.from(response.data);

    // Add text to the image
    const finalImageBuffer = await addTextToImage(
      generatedImageBuffer,
      "futureselfie.ai"
    );

    // Convert your buffer into a base64 string to send in a JSON response
    const imageBase64 = finalImageBuffer.toString("base64");

    res.json({
      message: "Image generated successfully",
      imageData: `data:image/png;base64,${imageBase64}`,
    });

    await savetocsv(
      firstName,
      email,
      mainScene,
      location,
      mainCharacter,
      additionalCharacters,
      additionalInfo,
      imageCopy,
      imageUrl,
      Organization
    );
    // After sending response, upload the updated CSV to Google Drive
    await handleCSVOnGoogleDrive(csvFilePath);
    console.log("CSV updated and uploaded to Google Drive successfully.");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error generating image" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
