import axios from 'axios';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env.local') });

const blingApi = axios.create({
  baseURL: 'https://www.bling.com.br/Api/v3',
  headers: { Authorization: `Bearer ${process.env.BLING_ACCESS_TOKEN}` }
});

async function testarImg() {
  const payload = {
    nome: "Teste de Imagem API v3",
    tipo: "P",
    situacao: "A",
    formato: "S",
    midia: {
      imagens: {
        externas: [
          { link: "https://http2.mlstatic.com/D_NQ_NP_906950-MLB745078235_022024-F.jpg" }
        ]
      }
    }
  };

  try {
    const res = await blingApi.post('/produtos', payload);
    console.log("POST /produtos SUCCESS:", JSON.stringify(res.data, null, 2));

    const id = res.data.data.id;
    const fetchRes = await blingApi.get(`/produtos/${id}`);
    console.log("GET /produtos SUCCESS:", JSON.stringify(fetchRes.data, null, 2));
    
  } catch (err: any) {
    console.error("ERRO:", JSON.stringify(err.response?.data, null, 2));
  }
}

testarImg();
