require('dotenv').config();

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('GEMINI_API_KEY nao encontrada no .env');
    return;
  }
  
  const prompt = `Você é um especialista em mídias físicas (CDs, DVDs, Blu-rays). 
Escreva uma descrição editorial curta (3-4 frases) em português para o produto: "CD Beatles Revolver".
Informe o tipo de mídia, gênero (musical ou cinematográfico), período/ano aproximado se souber, e uma curiosidade interessante.
Não mencione preço nem condição do produto. Não use asteriscos nem markdown. Escreva de forma natural e envolvente.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  console.log('Chamando Gemini API...');
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 250, temperature: 0.7 },
      }),
    });
    
    if (!res.ok) {
      const err = await res.text();
      console.log('Erro na API:', res.status, err);
      return;
    }
    
    const data = await res.json();
    console.log('RESPOSTA GEMINI:');
    console.log(data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Vazio');
  } catch (err) {
    console.log('Erro de fetch:', err);
  }
}

testGemini();
