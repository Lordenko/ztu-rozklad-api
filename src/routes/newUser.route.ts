import { FastifyInstance } from 'fastify';
import { insertData } from '../services/newUser.service';

export default async function newUser(fastify: FastifyInstance) {
    console.log('Registering newUser route');

    const UserData = {
        body: {
            type: 'object',
            required: ['userName', 'password'],
            properties: {
                userName: { type: 'string' },
                password: { type: 'string' }
            }
        }
    }

    type NewUserBody = {
        userName: string;
        password: string;
    }

    fastify.post<{ Body: NewUserBody }>('/newuser', { schema: UserData }, async (request, reply) => {
        const { userName, password } = request.body;

        return await insertData(userName, password)
    });
}