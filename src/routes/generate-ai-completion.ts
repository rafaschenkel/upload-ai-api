import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { openai } from '../lib/openai';
import { OpenAIStream } from 'ai';
import { streamToResponse } from 'ai';

export async function generateAiCompletion(app: FastifyInstance) {
  app.post('/ai/complete', async (req, reply) => {
    const bodySchema = z.object({
      videoId: z.string().uuid(),
      prompt: z.string(),
      temperature: z.number().min(0).max(1).default(0.5)
    });

    const { videoId, prompt, temperature } = bodySchema.parse(req.body); // recebe o ID do video, prompt, temperatura, passadas no corpo da requisição

    const video = await prisma.video.findUniqueOrThrow({
      where: {
        id: videoId
      }
    }); // busca no bd o video correspondente ao ID informado

    if (!video.transcription) {
      return reply.status(400).send({ error: 'Video transcription was not generated yet.' });
    } // retorna uma mensagem de erro caso o video não tenha uma transcrição

    const promptMessage = prompt.replace('{transcription}', video.transcription); // recebe o prompt junto com a transcrição do video

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-16k',
      temperature,
      messages: [
        {
          role: 'user',
          content: promptMessage
        }
      ],
      stream: true
    }); // recebe o resumo do video

    const stream = OpenAIStream(response);

    streamToResponse(stream, reply.raw, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET , POST , PUT , DELETE , OPTIONS'
      }
    });
  });
}
