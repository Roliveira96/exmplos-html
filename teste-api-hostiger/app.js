const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.json({ mensagem: "Aplicação rodando no suporte oficial da Hostinger!" });
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
