const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CHANNEL_TALK_API_KEY = process.env.CHANNEL_TALK_API_KEY;

app.post('/webhook', async (req, res) => {
  const userMessage = req.body?.message?.content;
  const userId = req.body?.user?.id;

  if (!userMessage || !userId) {
    return res.status(400).send('Invalid request');
  }

  try {
    // 1. ChatGPT에 질문
    const gptRes = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: userMessage }]
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const reply = gptRes.data.choices?.[0]?.message?.content;

    // 2. 채널톡으로 답변 전송
    await axios.post(
      `https://api.channel.io/open/v5/users/${userId}/messages`,
      {
        message: { type: 'text', text: reply }
      },
      {
        headers: {
          Authorization: `Bearer ${CHANNEL_TALK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(200).send('ok');
  } catch (error) {
    console.error('❌ 오류:', error.message);
    res.status(500).send('Server Error');
  }
});

const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
  res.send('GPT bot ready');
});
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
