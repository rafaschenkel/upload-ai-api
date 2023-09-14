import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { openai } from '../lib/openai';
import { createReadStream } from 'fs';

export async function createTranscriptionRoute(app: FastifyInstance) {
  app.post('/videos/:videoId/transcription', async req => {
    const paramsSchema = z.object({
      videoId: z.string().uuid()
    });

    const { videoId } = paramsSchema.parse(req.params); // recebe o id passado por parâmetro

    const bodySchema = z.object({
      prompt: z.string()
    });

    const { prompt } = bodySchema.parse(req.body); // recebe o prompt que foi enviado no corpo da requisição

    const video = await prisma.video.findUniqueOrThrow({
      where: {
        id: videoId
      }
    }); // busca no bd o video correspondente ao ID

    const videoPath = video.path; // recebe o caminho de onde esta o video

    const audioReadStream = createReadStream(videoPath); // lê o conteúdo do video

    const response = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: 'whisper-1',
      language: 'pt',
      prompt,
      temperature: 0,
      response_format: 'json'
    }); // cria a transcrição do audio

    const transcription = response.text; // recebe a transcrição do video

    await prisma.video.update({
      where: {
        id: videoId
      },
      data: {
        transcription
      }
    }); // faz o update do conteúdo no bd acrescentando a sua transcrição

    return { transcription };
  });
}
