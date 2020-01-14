const https = require('https')
const http = require('http')

module.exports = function fetchUrlFactory ({ concurrency }) {
  let running = 0
  let queue = []

  function processQueue () {
    if (running >= concurrency) return
    if (!queue.length) return

    const getUrlTask = queue.shift()
    running++
    if (running.length < concurrency) processQueue()

    getUrl(getUrlTask)
  }

  function getUrl ({ url, resolve, reject }) {
    console.log(`Downloading ${url}`)
    const client = url.startsWith('https')
      ? https
      : http

    const req = client.get(url, (res) => {
      const { statusCode } = res
      if (statusCode !== 200) {
        reject(new Error(`Unexpected status code: ${statusCode}`))
        return
      }

      let content = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => (content += chunk))
      res.on('end', () => resolve({
        content,
        headers: res.headers
      }))
    })

    req.on('error', reject)
  }

  return function fetchUrl (url) {
    return new Promise((resolve, reject) => {
      const resolveFn = (...args) => {
        running--
        resolve(...args)
        processQueue()
      }

      const rejectFn = (...args) => {
        running--
        reject(...args) // eslint-disable-line
        processQueue()
      }

      queue.push({
        url,
        resolve: resolveFn,
        reject: rejectFn
      })
      processQueue()
    })
  }
}
