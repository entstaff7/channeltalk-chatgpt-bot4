const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CHANNEL_TALK_API_KEY = process.env.CHANNEL_TALK_API_KEY;

app.post('/webhook', async (req, res) => {
  console.log('📬 Webhook 호출됨!');
  console.log('📦 받은 요청 body:', JSON.stringify(req.body, null, 2));

  const userMessage = req.body?.message?.content;
  const userId = req.body?.user?.id;

  if (!userMessage || !userId) {
    console.warn('⚠️ 유효하지 않은 요청: 메시지 또는 사용자 ID 누락');
    return res.status(400).send('Invalid request');
  }

  console.log('💬 사용자 질문:', userMessage);

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
    console.log('🤖 GPT 응답:', reply);

    // 2. 채널톡으로 답변 전송
    const sendRes = await axios.post(
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

    console.log('📤 채널톡에 메시지 전송 완료:', sendRes.status);
    res.status(200).send('ok');
  } catch (error) {
    console.error('❌ 오류 발생:', error.response?.data || error.message);
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
