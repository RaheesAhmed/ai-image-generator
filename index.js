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

dotenv.config();

const apiKey = process.env["OPENAI_API_KEY"];
const openai = new OpenAI({ apiKey });
const app = express();
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

const getFileContent = async (drive, fileId) => {
  const response = await drive.files.get(
    {
      fileId: fileId,
      alt: "media",
    },
    {
      responseType: "stream",
    }
  );

  return new Promise((resolve, reject) => {
    const chunks = [];
    response.data
      .on("data", (chunk) => chunks.push(chunk))
      .on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")))
      .on("error", reject);
  });
};

const savetocsv = async (
  firstName,
  email,
  mainScene,
  location,
  mainCharacter,
  additionalCharacters,
  additionalInfo,
  imageCopy,
  imageUrl
) => {
  // Define the header and data format.
  const headers =
    "First Name,Email,Main Scene,Location,Main Character,Additional Characters,Additional Info,Image Copy,Image Link\n";
  const data = `${firstName},${email},${mainScene},${location},${mainCharacter},${additionalCharacters},${additionalInfo},${imageCopy},${imageUrl}\n`;

  const fileId = "1mwBP2NcooQzRElg66sNDMQpy1y1golVg"; // The ID of your userDetails.csv file

  // Get the existing content of the file from Google Drive
  let existingContent = "";
  try {
    existingContent = await getFileContent(drive, fileId);
  } catch (error) {
    console.error("Error downloading the file:", error);
    return;
  }

  // Determine whether we need to add headers
  const finalData = existingContent.includes("First Name")
    ? existingContent + data
    : headers + existingContent + data;

  // Convert the final data to a stream
  const bufferStream = new stream.PassThrough();
  bufferStream.end(Buffer.from(finalData, "utf-8"));

  // Update the file on Google Drive
  try {
    await drive.files.update({
      fileId: fileId,
      media: {
        mimeType: "text/csv",
        body: bufferStream,
      },
    });
    console.log("CSV file updated in Google Drive");
  } catch (error) {
    console.error("Error updating the file:", error);
  }
};

app.post("/generate-images", upload.none(), async (req, res) => {
  try {
    console.log("Received data:", req.body);

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
    console.log("Data Saved to CSV in Google Drive");
    res.json({
      message: "Image generated successfully",
      imageData: [imageUrl],
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error generating image" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
