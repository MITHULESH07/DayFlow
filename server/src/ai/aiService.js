const Groq = require('groq-sdk');
const { SYSTEM_PROMPT, buildUserPrompt } = require('./prompts');

class AiServiceUnavailableError extends Error {}

function createGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new AiServiceUnavailableError('Groq API key is not configured.');
  }

  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

async function generateResponse(message) {
  try {
    const completion = await createGroqClient().chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 300,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(message) }
      ]
    });

    const message = completion.choices?.[0]?.message?.content?.trim();
    if (!message) {
      throw new AiServiceUnavailableError('Groq returned an empty response.');
    }

    return message;
  } catch (error) {
    if (error instanceof AiServiceUnavailableError) throw error;
    console.error('Groq request failed:', error.status || error.name);
    throw new AiServiceUnavailableError('Groq request failed.');
  }
}

module.exports = { generateResponse, AiServiceUnavailableError };
