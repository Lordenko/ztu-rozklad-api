import { FastifyInstance } from 'fastify';

import { getGroupId } from '../services/groupId.service';

export default async function groupIdRoute(fastify: FastifyInstance) {
    fastify.get('/groupId/:name', async (request, reply) => {
        const { name } = request.params as { name: string };
        const result = await getGroupId(name);
        return result;
    });
}
