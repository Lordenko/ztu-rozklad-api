import { FastifyInstance } from 'fastify';
import { fetchGroup } from '../services/group.service.js';

export default async function parserRoutes(fastify: FastifyInstance) {
  fastify.get('/group/:id', async (request, reply) => {
    const { id } = request.params as { id: number };

    console.time("time");
    const result = await fetchGroup(id);
    console.timeEnd("time");

    return { json: result };
  });
}
