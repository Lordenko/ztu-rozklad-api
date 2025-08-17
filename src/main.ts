import Fastify from 'fastify';

import GroupRoute from './routes/group.route';
import NewUserRoute from './routes/newUser.route';
import UpdUserRoute from './routes/updUser.route';
import { DataBase } from './utils/DataBase/DataBase';

const fastify = Fastify({
    logger: false,
});

const dataBase = new DataBase();
dataBase.create();
dataBase.checkSuperUser();

fastify.register(NewUserRoute);
fastify.register(GroupRoute);
fastify.register(UpdUserRoute);

fastify.listen({ port: 8080 }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening at ${address}`);
});
