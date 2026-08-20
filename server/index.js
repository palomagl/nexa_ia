import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: "Servidor Nexa AI rodando perfeitamente!" });
});

// Rota onde o front-end vai enviar o prompt
app.post('/api/generate', async (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: "O prompt não pode estar vazio!" });
  }

  console.log("Prompt recebido:", prompt);
  
  // Por enquanto, vamos retornar uma resposta simulada para testarmos a conexão
  res.json({ 
    success: true, 
    code: `// Código gerado para: ${prompt}\nexport default function GeneratedApp() { return <div className="p-6 text-white bg-slate-900 min-h-screen"><h1>Olá do App Gerado!</h1></div>; }` 
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});