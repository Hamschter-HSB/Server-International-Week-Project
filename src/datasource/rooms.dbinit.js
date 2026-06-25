import path from 'path'
import { fileURLToPath } from 'url'
import Room from '../models/room.model.js'
import { readCSV } from './tools.dbinit.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function initRoomsBdD(env) {
  const rows = readCSV(path.join(__dirname, 'rooms.csv'))

  for (const row of rows) {
    if (row.env !== 'all' && row.env !== env) continue

    try {
      const existing = await Room.findOne({ name: row.name }).exec()
      if (existing !== null) continue

      const room = new Room({
        name: row.name,
        uuid: row.uuid,
        building: row.building,
      })
      await room.save()
      console.info(`created room: ${row.name}`)
    }
    catch (err) {
      console.log(`cannot verify/create room ${row.name}: ${err.message}`)
    }
  }
}

export default initRoomsBdD
