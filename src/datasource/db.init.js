import initAccountsBdD from './accounts.dbinit.js'
import initRoomsBdD from './rooms.dbinit.js'

async function initBdD() {
  const env = process.env.NODE_ENV
  await initAccountsBdD(env)
  await initRoomsBdD(env)
}

export default initBdD
