import { FastifyInstance } from 'fastify';
import { fetchGroup } from '../services/group.service.js';

export default async function group(fastify: FastifyInstance) {
    fastify.get('/group/:id', async (request, reply) => {
        const { id } = request.params as { id: number };
        const { username } = request.query as { username?: string | undefined };

        const result = await fetchGroup(id, username);
        console.log(result);

        return result;
    });

}
