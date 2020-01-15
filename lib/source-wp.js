const { URLSearchParams } = require('url')
const fetchUrlFactory = require('./fetch-url-factory')

const fetchUrl = fetchUrlFactory({ concurrency: 20 })

async function fetchContentTypes ({ endpoint, exclude = [], include = [] }) {
  return Object.keys(await fetchWpContentType(endpoint, 'types'))
    .filter(type => !exclude.includes(type))
    .concat(include)
}

module.exports = async function sourceWp (options) {
  const { endpoint } = options
  const types = await fetchContentTypes(options)

  const contentArr = await Promise.all(
    types.map(
      type => fetchWpContentType(endpoint, type)
    )
  )

  const content = contentArr.reduce((acc, cur, idx) => {
    const type = types[idx]
    acc[type] = cur
    return acc
  }, {})

  return content
}

function fetchWpContentType (endpoint, contentType, { page = null, perPage = 100 } = {}) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      const params = new URLSearchParams([
        ['per_page', perPage]
      ])
      if (page !== null) {
        params.append('page', page)
      }

      const url = endpoint + '/' + contentType
      const pageUrl = `${url}?${params}`
      const { content: pageContent, headers } = await fetchUrl(pageUrl)
      let data = JSON.parse(pageContent)
      const totalPages = headers['x-wp-totalpages']

      if (page === null && totalPages > 1) {
        const pages = []
        for (let pageNum = 2; pageNum <= totalPages; pages.push(pageNum++));
        (
          await Promise.all(pages.map(page => fetchWpContentType(endpoint, contentType, { page })))
        )
          .forEach(pageData => (data = data.concat(pageData)))
      }

      resolve(data)
    } catch (e) {
      reject(e)
    }
  })
}
