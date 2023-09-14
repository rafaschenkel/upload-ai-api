import { fastify } from 'fastify';
import { fastifyCors } from '@fastify/cors';
import { getAllPromptsRoute } from './routes/get-all-prompts';
import { uploadVideosRoute } from './routes/upload-video';
import { createTranscriptionRoute } from './routes/create-transcription';
import { generateAiCompletion } from './routes/generate-ai-completion';

const app = fastify();

app.register(fastifyCors, {
  origin: '*'
});
app.register(getAllPromptsRoute);
app.register(uploadVideosRoute);
app.register(createTranscriptionRoute);
app.register(generateAiCompletion);

app
  .listen({
    port: 3333
  })
  .then(() => console.log('HTTP Server Runnning!'));
