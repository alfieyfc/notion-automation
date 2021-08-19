
const dotenv = require("dotenv")

dotenv.config()


const config_path = process.env.CONFIG_PATH
const users_path = process.env.USERS_PATH

const attr = require("./tools/attributes")
const utils = require("./tools/utils")
const napi = require("./tools/notion-api")

napi.auth(process.env.NOTION_KEY, "DEBUG")
createPages()

async function createPages () {
  let users = await utils.load_config(users_path)
  let objs = await utils.load_config(config_path)
  // loop through array
  for (obj of objs) {
    let database = obj.database
    let pages = obj.pages
    // loop through pages
    for (page of pages) {
      let result = await attr.generatePageObject(database, page, users)
      napi.createPage(result)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
