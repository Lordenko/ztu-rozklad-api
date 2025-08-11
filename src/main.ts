import Fastify from 'fastify'

import GroupRoute from './routes/group.route'
import NewUserRoute from './routes/newUser.route'
import { createDataBase } from './utils/DataBase/createDataBase'

const fastify = Fastify({
  logger: false
})

createDataBase()

fastify.register(NewUserRoute)
fastify.register(GroupRoute)

fastify.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})