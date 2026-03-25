import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: 'A modern, professional, and minimalist logo for an application called "PEX INTERFERIR". The logo should be clean, corporate, and suitable for a business management or retail application. Use a color palette of blue and white. No complex backgrounds.',
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64Data = part.inlineData.data;
        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(path.join(process.cwd(), 'public', 'logo.png'), buffer);
        console.log('Logo saved successfully.');
        break;
      }
    }
  } catch (err) {
    console.error('Error generating logo:', err);
  }
}

main();
