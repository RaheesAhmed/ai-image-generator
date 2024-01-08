import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
const apiKey = process.env.OPENAI_API_KEY;

dotenv.config();
const openai = new OpenAI({ apiKey });
const app = express();
const port = 3000;
const upload = multer();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

//get the username and email from the /generate-images and save it into the userdsDetails.csv file in the public folder
const savetocsv = (firstName, email) => {
  const data = `${firstName},${email}\n`;
  fs.appendFile("public/userDetails.csv", data, (err) => {
    if (err) throw err;
    console.log("Data added to file");
  });
};

app.post("/generate-images", upload.none(), async (req, res) => {
  try {
    console.log("Received data:", req.body);
    const { firstName, email } = req.body;
    savetocsv(firstName, email);

    const {
      mainScene,
      location,
      mainCharacter,
      additionalCharacters,
      additionalInfo,
    } = req.body;
    const prompt = `Create a cinematic still in 32k resolution and landscape format depicting ${mainScene}, located at ${location}. The main character is ${mainCharacter}. Additional characters include ${additionalCharacters}. ${additionalInfo}`;

    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1, // Number of images to generate
      size: "1024x1024", // Size of the image (can be adjusted as needed)
    });

    console.log("Generated image data:", imageResponse.data);
    const imageUrl = imageResponse.data[0].url;
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
