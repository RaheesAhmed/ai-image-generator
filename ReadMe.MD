# Project Name

## Description

This project is a Node.js server application that uses the Express.js framework. The server is designed to generate images based on user input using OpenAI's DALL-E 3 model.

The server listens on port 3000 and serves static files from the "public" directory. It uses the multer middleware for handling multipart/form-data, which is primarily used for uploading files.

The server exposes a POST endpoint at "/generate-images". This endpoint accepts a JSON payload containing details about a scene, including the main scene, location, main character, additional characters, and additional information. These details are used to construct a prompt for the DALL-E 3 model.

The DALL-E 3 model generates an image based on the prompt and returns a URL to the generated image. The server then sends a response containing a success message and the URL of the generated image.

In case of any errors during the image generation process, the server responds with a status code of 500 and a message indicating an error occurred.

The server uses the dotenv package to load environment variables, including the OpenAI API key, from a .env file.

## Installation

To run this project, you need to have Node.js and VS Code installed on your machine. If you don't have them installed, follow the steps below:

1. Install Node.js: [Download Node.js](https://nodejs.org/en/download/) and follow the installation instructions for your operating system.

2. Install VS Code: [Download VS Code](https://code.visualstudio.com/download) and follow the installation instructions for your operating system.

## Getting Started

Follow the steps below to get started with the project:

1. Clone the repository: `git clone https://github.com/RaheesAhmed/ai-image-generator.git`

2. Install dependencies: Run `npm install` in the project directory.

3. Create a `.env` file in the project directory and add your OpenAI API key:

   ```plaintext
   OPENAI_API_KEY=your-api-key
   ```

4. Start the server: Run `npm start` in the project directory.

5. Access the app: Open your web browser and go to [http://localhost:3000/](http://localhost:3000/).

## Customization

To customize the prompt used in the application, follow the steps below:

1. Open the `index.js` file in your project directory.

2. Find the following line of code:

   ```javascript
   app.post("/generate-images", upload.none(), async (req, res) => {
     const prompt = `Create a cinematic still in 32k resolution and landscape format depicting ${mainScene}, located at ${location}. The main character is ${mainCharacter}. Additional characters include ${additionalCharacters}. ${additionalInfo}`;
   });
   ```

3. Modify the `prompt` variable as needed.

## Developed By

Rahees Ahmed
