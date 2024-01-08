# Project Name

## Description

This project is a [brief description of the project].

## Installation

To run this project, you need to have Node.js and VS Code installed on your machine. If you don't have them installed, follow the steps below:

1. Install Node.js: [Download Node.js](https://nodejs.org/en/download/) and follow the installation instructions for your operating system.

2. Install VS Code: [Download VS Code](https://code.visualstudio.com/download) and follow the installation instructions for your operating system.

## Getting Started

Follow the steps below to get started with the project:

1. Clone the repository: `git clone [repository URL]`

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
