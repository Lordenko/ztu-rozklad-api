import { FastifyInstance } from 'fastify';
import { fetchGroup } from '../services/group.service.js';

export default async function parserRoutes(fastify: FastifyInstance) {
  fastify.get('/group/:id', async (request, reply) => {
    const { id } = request.params as { id: number };

    console.time("request+parse");
    const result = await fetchGroup(id);
    console.timeEnd("request+parse");

    return { html: result };
  });
}
