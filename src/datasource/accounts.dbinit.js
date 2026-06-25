import path from 'path'
import { fileURLToPath } from 'url'
import Account, { PERMISSIONS } from '../models/account.model.js'
import { readCSV } from './tools.dbinit.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function initAccountsBdD(env) {
  const rows = readCSV(path.join(__dirname, 'accounts.csv'))

  for (const row of rows) {
    if (row.env !== 'all' && row.env !== env) continue

    try {
      const existing = await Account.findOne({ username: row.username }).exec()
      if (existing !== null) continue

      const permissions = PERMISSIONS[row.permissions]
      if (permissions === undefined) {
        console.log(`unknown permissions '${row.permissions}' for account ${row.username}`)
        continue
      }

      const account = new Account({
        username: row.username,
        password: row.password,
        email: row.email,
        permissions,
      })
      await account.save()
      console.info(`created account: ${row.username}`)
    }
    catch (err) {
      console.log(`cannot verify/create account ${row.username}: ${err.message}`)
    }
  }
}

export default initAccountsBdD
