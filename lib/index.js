const path = require('path')
const fs = require('fs')
const sourceWp = require('./source-wp')

module.exports.onAfterLoadRes = async function onAfterLoadRes (jamsite) {
  return loadWpData(jamsite)
}

async function loadWpData (jamsite) {
  // fixme: config

  // read data from stale cache unless configured otherwise
  // const refreshCache = true
  const refreshCache = false
  const useCache = true

  const cacheDir = path.join(jamsite.paths.var, 'plugin-source-wp')
  const cachedData = (useCache && !refreshCache)
    ? readFromCache(cacheDir)
    : false

  // use cachedData if available
  const data = cachedData
    ? cachedData
    : await sourceWp({
        endpoint: 'https://example.com/site-name/wp-json/wp/v2',
        exclude: ['post', 'page', 'attachment']
      })

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
  return files.map((filePath) =>
    JSON.parse(
      fs.readFileSync(filePath, { encoding: 'utf8' })
    )
  )
}

function saveToCache (data, cacheDir) {
  for (const name in data) {
    const fsPath = path.join(cacheDir, `${name}.json`)
    fs.writeFileSync(fsPath, JSON.stringify(data[name], null, 2))
  }
}
