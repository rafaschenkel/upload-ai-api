import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';

export async function getAllPromptsRoute(app: FastifyInstance) {
  app.get('/prompts', async () => {
    const prompts = await prisma.prompt.findMany(); // recupera do bd todos os prompts
    return prompts;
  });
}
