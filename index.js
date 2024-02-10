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

const port = 3000;
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
  // Define the header and data format.
  const headers = "First Name,Email,Main Scene,Location,Main Character,Additional Characters,Additional Info,Image Copy,Image Link,Organization\n";
  const data = `${firstName},${email},${mainScene},${location},${mainCharacter},${additionalCharacters},${additionalInfo},${imageCopy},${imageUrl},${Organization}\n`;

  // Check if the CSV file exists and append data or create a new file with headers and data
  fs.promises
    .access(csvFilePath, fs.constants.F_OK)
    .then(() => {
      console.log("CSV file exists. Appending data.");
      return fs.promises.appendFile(csvFilePath, data);
    })
    .then(() => {
      console.log("Data appended to CSV file successfully.");
      // After saving the CSV locally, call the function to upload the file to Google Drive
      uploadCSVToDrive(csvFilePath);
    })
    .catch((error) => {
      console.log("CSV file does not exist or another error occurred. Attempting to create file.", error);
      return fs.promises.writeFile(csvFilePath, headers + data);
    })
    .then(() => {
      console.log("CSV file created with headers and data.");
      // After saving the CSV locally, call the function to upload the file to Google Drive
      uploadCSVToDrive(csvFilePath);
    })
    .catch((error) => {
      console.error("Error writing to CSV file:", error);
    });
};

const uploadCSVToDrive = async (csvFilePath) => {
  const folderId = process.env.GOOGLE_FOLDER_ID; // Ensure this is correctly set in your .env file
  console.log("Uploading CSV to Google Drive. Folder ID:", folderId);
  try {
    const fileMetadata = {
      name: "FutureSelfie-New-Data.csv",
      parents: [folderId],
    };
    const media = {
      mimeType: "text/csv",
      body: fs.createReadStream(csvFilePath),
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id",
    });
    console.log("File uploaded to Google Drive with ID:", response.data.id);
  } catch (error) {
    console.error("Error uploading file to Google Drive:", error);
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

app.post("/generate-images", upload.none(), async (req, res) => {
  console.log("data recieved:",req.body)
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

    
    console.log("Data Saved to CSV in Google Drive");
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
      imageUrl
    );
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error generating image" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
