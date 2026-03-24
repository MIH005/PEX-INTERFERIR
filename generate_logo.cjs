const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

async function main() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: 'A professional corporate logo for an application called "PEX INTERFERIR". The logo should be modern, clean, and represent action plans, strategic dashboard, and retail management. Use a color palette of blue and white. Minimalist design, vector art style.',
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const base64EncodeString = part.inlineData.data;
      const buffer = Buffer.from(base64EncodeString, 'base64');
      fs.writeFileSync(path.join(__dirname, 'public', 'logo.png'), buffer);
      console.log('Logo generated and saved to public/logo.png');
      break;
    }
  }
}

main().catch(console.error);
