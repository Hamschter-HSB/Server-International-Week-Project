import fs from 'fs'

function parseLine(line) {
  const fields = []
  let current = ''
  let inQuotes = false
  let i = 0
  while (i < line.length) {
    const c = line[i]
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      current += c
      i++
    }
    else {
      if (c === '"') {
        inQuotes = true
        i++
        continue
      }
      if (c === ',') {
        fields.push(current)
        current = ''
        i++
        continue
      }
      current += c
      i++
    }
  }
  fields.push(current)
  return fields
}

function readCSV(filepath) {
  const content = fs.readFileSync(filepath, 'utf8')
  const lines = content.split(/\r?\n/).filter(l => l.length > 0)
  if (lines.length === 0) return []
  const headers = parseLine(lines[0]).map(h => h.trim())
  const result = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i])
    const obj = {}
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = values[j] !== undefined ? values[j] : ''
    }
    result.push(obj)
  }
  return result
}

export { readCSV }
