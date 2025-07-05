import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Tesseract from 'tesseract.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS for frontend
app.use(cors({ origin: ['https://hcchatboat.netlify.app'] }));
app.use(express.json({ limit: '10mb' }));

// ✅ Gemini API
const genAI = new GoogleGenerativeAI("YOUR_GEMINI_API_KEY");

// ✅ Health check route
app.get('/', (req, res) => {
  res.send('✅ HC Kabdwal Bot is Running!');
});

// ✅ Chat endpoint
app.post('/chat', async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) {
    return res.status(400).json({ reply: '❌ Message is required.' });
  }

  const greetings = ['hello', 'hi', 'namaste', 'hey', 'salam'];
  const msg = message.trim().toLowerCase();

  if (greetings.includes(msg)) {
    return res.json({
      reply: '🎓 Sobhan Singh आ गया 💥 अब मुश्किल सवालों की खैर नहीं! चलो गणित के जंग में हल निकाले जाएं 📐🧠',
    });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: {
        role: "user",
        parts: [{
          text: `
आप HC Kabdwal हैं — एक अनुभवी गणित शिक्षक।

अगर उपयोगकर्ता गणित (Maths) से जुड़ा सवाल पूछे — जैसे algebra, trigonometry, arithmetic, geometry, calculus — तो उसका उत्तर विस्तार से, उदाहरण सहित हिन्दी में दो।

अगर सवाल कोडिंग, इतिहास, सामान्य ज्ञान या किसी और विषय से जुड़ा हो — तो साफ़ शब्दों में कहो:
"मैं एक गणित का शिक्षक हूँ, केवल Maths से जुड़े सवालों का उत्तर देता हूँ। कृपया कोई गणित का सवाल पूछें।"

हर जवाब साफ, शुद्ध हिंदी में दो, ताकि 10वीं-12वीं का बच्चा भी समझ सके।
`
        }]
      }
    });

    const result = await model.generateContent([message]);
    const response = await result.response;
    const text = await response.text();

    res.json({ reply: text });
  } catch (err) {
    console.error('Gemini Error:', err.message);
    res.status(500).json({ reply: '❌ Gemini से बात नहीं हो पाई' });
  }
});

// ✅ OCR + Gemini
app.post('/ocr-math', async (req, res) => {
  const { image } = req.body;
  if (!image) return res.status(400).json({ text: '' });

  try {
    const result = await Tesseract.recognize(
      Buffer.from(image, 'base64'),
      'eng',
      { logger: m => console.log(m) }
    );

    const extractedText = result.data.text.trim();
    if (!extractedText) return res.json({ text: '' });

    // Send extracted text to Gemini
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: {
        role: "user",
        parts: [{
          text: `
आप HC Kabdwal हैं — एक अनुभवी गणित शिक्षक।

अगर उपयोगकर्ता गणित (Maths) से जुड़ा सवाल पूछे — जैसे algebra, trigonometry, arithmetic, geometry, calculus — तो उसका उत्तर विस्तार से, उदाहरण सहित हिन्दी में दो।

अगर सवाल कोडिंग, इतिहास, सामान्य ज्ञान या किसी और विषय से जुड़ा हो — तो साफ़ शब्दों में कहो:
"मैं एक गणित का शिक्षक हूँ, केवल Maths से जुड़े सवालों का उत्तर देता हूँ। कृपया कोई गणित का सवाल पूछें।"

हर जवाब साफ, शुद्ध हिंदी में दो, ताकि 10वीं-12वीं का बच्चा भी समझ सके।
`
        }]
      }
    });

    const geminiRes = await model.generateContent([extractedText]);
    const geminiText = await geminiRes.response.text();

    res.json({ reply: geminiText });
  } catch (err) {
    console.error('OCR or Gemini Error:', err.message);
    res.status(500).json({ reply: '❌ OCR या Gemini में दिक्कत आ गई' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
