import Fastify from 'fastify'

import GroupRoute from './routes/group.route'

const fastify = Fastify({
  logger: false
})

fastify.register(GroupRoute)

fastify.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Server listening at ${address}`)
})