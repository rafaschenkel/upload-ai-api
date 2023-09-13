import { FastifyInstance } from 'fastify';
import { fastifyMultipart } from '@fastify/multipart';
import { prisma } from '../lib/prisma';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { promisify } from 'node:util';
import { pipeline } from 'node:stream';

const pump = promisify(pipeline);

export async function uploadVideosRoute(app: FastifyInstance) {
  app.register(fastifyMultipart, {
    limits: {
      fileSize: 1_048_576 * 30 // 30mb
    } // informa o limite máximo do tamanho do arquivo
  });

  app.post('/videos', async (request, reply) => {
    const data = await request.file(); // recebe o arquivo que foi enviado

    if (!data) return reply.status(400).send({ error: 'Missing file input.' }); // retorna erro caso nao seja enviado um arquivo

    const extension = path.extname(data.filename); // retorna a extensão do arquivo

    if (extension !== '.mp3') {
      return reply.send({ error: 'Invalid input type, please upload a MP3' });
    } // verifica se a extensão é mp3

    const fileBaseName = path.basename(data.filename, extension); // retorna o nome do arquivo sem a extensão
    const fileUploadName = `${fileBaseName}-${randomUUID()}${extension}`; // retorna um nome único para o arquivo

    const uploadDestination = path.resolve(__dirname, '../../tmp', fileUploadName); // destino e nome para o arquivo carregado

    await pump(data.file, fs.createWriteStream(uploadDestination)); // salva o arquivo no disco

    const video = await prisma.video.create({
      data: {
        name: data.filename,
        path: uploadDestination
      }
    }); // salva a informação no bd

    return { video }; // retorna o objeto que foi adicionado ao bd
  });
}
