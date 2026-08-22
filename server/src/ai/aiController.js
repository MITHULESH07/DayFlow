const { generateResponse, AiServiceUnavailableError } = require('./aiService');

const MAX_MESSAGE_LENGTH = 2000;

async function chat(req, res) {
  const { message } = req.body || {};
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message is required.' });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ success: false, message: 'Message is too long.' });
  }

  try {
    console.info('AI request received', { userId: req.user.userId });
    const answer = await generateResponse(message.trim());
    console.info('AI request completed', { userId: req.user.userId });
    return res.json({ success: true, message: answer });
  } catch (error) {
    console.error('AI request failed:', error.message);
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    if (error instanceof AiServiceUnavailableError) {
      return res.status(503).json({ success: false, message: 'AI service is temporarily unavailable.' });
    }
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

module.exports = { chat };
