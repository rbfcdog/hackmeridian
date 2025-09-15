// src/server.ts
import dotenv from 'dotenv';
dotenv.config(); // Carrega as variáveis de ambiente

import app from './app';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});