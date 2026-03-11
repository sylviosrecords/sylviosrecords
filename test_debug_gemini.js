require('dotenv').config();
const apiKey = process.env.GEMINI_API_KEY;
const prompt = \Você é um especialista em mídias físicas.
Descreva o produto: DVD Casablanca.
Escreva 1 parágrafo com 3 frases inteiras.\;

async function test() {
  const url = \https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=\\;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 600, temperature: 0.5 },
    }),
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
test();
