// index.js
const express = require('express');
const app = express();

app.get('/hello', (req, res) => {
  res.send('Hello Express!');
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
