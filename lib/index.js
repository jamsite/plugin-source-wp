const path = require('path')
const fs = require('fs')
const sourceWp = require('./source-wp')

module.exports = {
  options: {},

  async onAfterLoadRes (jamsite) {
    return loadWpData(jamsite, this.options)
  },

  setOptions (options) {
    this.options = options
  }
}

async function loadWpData (jamsite, options) {
  const {
    refreshCache = false,
    useCache = true,
    endpoint,
    exclude = []
  } = options

  // read data from stale cache unless configured otherwise
  const cacheDir = path.join(jamsite.paths.var, 'plugin-source-wp')
  const cachedData = (useCache && !refreshCache)
    ? readFromCache(cacheDir)
    : false

  // use cachedData or fetch data from wp endpoint
  const data = cachedData || await sourceWp({ endpoint, exclude })

  // import data into jamsite
  importData(jamsite, data)

  // save data to stale cache unless configured otherwise
  if (data && useCache && (refreshCache || !cachedData)) {
    saveToCache(data, cacheDir)
  }

  return data
}

function importData (jamsite, data) {
  for (const name in data) {
    jamsite.dataContext.addStatic(name, data[name])
  }
}

function readFromCache (cacheDir) {
  const files = fs.readdirSync(cacheDir).map((filePath) => path.join(cacheDir, filePath))
  const res = {}
  files.map((filePath) => {
    const { name } = path.parse(filePath)
    res[name] = JSON.parse(
      fs.readFileSync(filePath, { encoding: 'utf8' })
    )
  })
  return res
}

function saveToCache (data, cacheDir) {
  for (const name in data) {
    const fsPath = path.join(cacheDir, `${name}.json`)
    fs.writeFileSync(fsPath, JSON.stringify(data[name], null, 2))
  }
}
