const databaseId = process.env.NOTION_DATABASE_ID

const { Client, LogLevel } = require("@notionhq/client")

var notion

module.exports = {
  auth: function (_notion_key, _debug_level) {
    notion = new Client({
      auth: _notion_key,
      logLevel: LogLevel._debug_level,
    })
  },
  queryDb: async function (_filter) {
    const pages = await notion.databases.query({
      database_Id: databaseId,
      filter: _filter
    })
    return pages.results
  },
  createPage: async function (_data) {
    await notion.pages.create(_data)
  }
}
