import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
import cors from "cors";
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

const savetocsv = (
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

  // Check if the file exists and if it's empty to decide if headers should be added.
  fs.readFile("public/userDetails.csv", "utf8", (err, fileData) => {
    if (err && err.code === "ENOENT") {
      // If file does not exist, create it and add headers.
      return fs.writeFile(
        "public/userDetails.csv",
        headers + data,
        (writeErr) => {
          if (writeErr) throw writeErr;
          console.log("File created and data added with headers");
        }
      );
    }
    if (err) {
      // If other errors, throw them.
      throw err;
    }
    if (fileData.trim() === "") {
      // If file exists but is empty, add headers.
      return fs.writeFile(
        "public/userDetails.csv",
        headers + data,
        (writeErr) => {
          if (writeErr) throw writeErr;
          console.log("Headers added and data added to file");
        }
      );
    }
    // If file exists and is not empty, append data.
    fs.appendFile("public/userDetails.csv", data, (appendErr) => {
      if (appendErr) throw appendErr;
      console.log("Data added to file");
    });
  });
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
      // DaLL e 3 supported images sizes:1024x1024, 1792x1024,1024x1792
    });

    console.log("Generated image data:", imageResponse.data);
    const imageUrl = imageResponse.data[0].url;

    savetocsv(
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
    console.log("Data Saved to CSV");
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
