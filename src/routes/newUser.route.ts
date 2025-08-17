import { FastifyInstance } from 'fastify';
import { insertData } from '../services/newUser.service';

export default async function newUser(fastify: FastifyInstance) {
    const UserData = {
        body: {
            type: 'object',
            required: ['userName', 'password'],
            properties: {
                type: { type: 'string' },
                userName: { type: 'string' },
                password: { type: 'string' },
            },
        },
    };

    type NewUserBody = {
        type: string;
        userName: string;
        password: string;
    };

    fastify.post<{ Body: NewUserBody }>(
        '/newuser',
        { schema: UserData },
        async (request, reply) => {
            const { type, userName, password } = request.body;

            return await insertData(type, userName, password);
        },
    );
}
