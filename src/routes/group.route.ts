import { FastifyInstance } from 'fastify';
import { fetchTitle } from '../services/group.service.js';

export default async function parserRoutes(fastify: FastifyInstance) {
  fastify.get('/group', async (request, reply) => {


    return { success: true };
  });
}
