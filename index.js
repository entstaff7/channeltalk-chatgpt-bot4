const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post('/webhook', async (req, res) => {
  const userMessage = req.body?.content;

  if (!userMessage) return res.status(400).send('No content received.');

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: userMessage }],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const reply = response.data.choices[0].message.content;
    res.json({ content: reply });
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'ChatGPT error' });
  }
});

// 👉 GET 요청에도 응답하도록 수정 (404 방지)
app.get('/webhook', (req, res) => {
  res.send('POST only: ChatGPT webhook endpoint for Channeltalk.');
});

// 루트 경로
app.get('/', (req, res) => res.send('ChatGPT + Channeltalk Ready!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
