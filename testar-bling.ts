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

async function findDepositos() {
    try {
        const { data } = await blingApi.get('/depositos');
        console.log("Depósitos no Bling:");
        console.log(JSON.stringify(data.data, null, 2));
    } catch (e: any) {
        console.error("Erro ao puxar depósitos:", e.response?.data || e.message);
    }
}

findDepositos();
