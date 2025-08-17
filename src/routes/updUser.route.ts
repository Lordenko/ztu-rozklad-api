import { FastifyInstance } from 'fastify';
import { updData } from '../services/updUser.service';

export default async function updUser(fastify: FastifyInstance) {
    const UserData = {
        body: {
            type: 'object',
            required: ['userName'],
            properties: {
                userName: { type: 'string' },
                tokenRozklad: { type: 'string' },
                tokenCabinet: { type: 'string' },
            },
        },
    };

    type UpdateUserBody = {
        userName: string;
        tokenRozklad: string;
        tokenCabinet: string;
    };

    fastify.patch<{ Body: UpdateUserBody }>(
        '/upduser',
        { schema: UserData },
        async (request, reply) => {
            const { userName, tokenCabinet, tokenRozklad } = request.body;
            return await updData(userName, tokenCabinet, tokenRozklad);
        },
    );
}
