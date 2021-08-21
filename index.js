const dotenv = require("dotenv")
dotenv.config()

const { Client, LogLevel } = require("@notionhq/client")

const env_mode = process.env.MODE
const env_pages_path = process.env.PAGES_PATH
const env_updates_path = process.env.UPDATES_PATH
const env_users_path = process.env.USERS_PATH

const attr = require("./tools/attributes")
const utils = require("./tools/utils")

// Authenticate Notion
const n_api = new Client({
  auth: process.env.NOTION_KEY,
  logLevel: LogLevel.WARN,
})

main()

async function main () {
  // Run under specified MODE.
  console.log("Running under " + env_mode + " mode.")
  switch (env_mode) {
    case ("create"):
      users = await utils.load_config(env_users_path)
      console.log("File user.json loaded.")
      objects = await utils.load_config(env_pages_path)
      console.log("File pages.json loaded.")
      createPages(users, objects)
      break;
    case ("delete"):
      deletion = await utils.load_config(env_updates_path)
      console.log("File updates.json loaded.")
      deletePages(deletion)
      break;
    case ("update"):
      users = await utils.load_config(env_users_path)
      console.log("File user.json loaded.")
      objects = await utils.load_config(env_updates_path)
      console.log("File updates.json loaded.")
      updatePages(users, objects)
      break;
    default:
      console.log("Unrecognized MODE.")
      break;
  }
}

function createPages (_users, _objects) {
  for (obj of _objects) {
    let database = obj.database
    let pages = obj.pages
    for (page of pages) {
      attr.generatePageObject(database, page, _users)
        .then(async (result) => {
          // console.log(result)
          n_api.pages.create(result)
          await new Promise(resolve => setTimeout(resolve, 500));
        })
    }
  }
}

async function deletePages (_objects) {
  let databases = _objects.databases
  let filter = _objects.filter
  for (db of databases) {
    n_api.databases.query({
      database_id: db.id,
      filter: filter
    })
      .then(async (result) => {
        for (page of result.results) {
          n_api.pages.update({
            page_id: page.id,
            archived: true
          })
          console.log("Archiving page: " + page.id)
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }).catch(error => {
        console.log(error.message)
        process.exit(1);
      })
    console.log("Going through DB: " + db.id)
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

async function updatePages (_users, _objects) {
  let databases = _objects.databases
  let filter = _objects.filter
  let properties = _objects.properties
  for (db of databases) {
    n_api.databases.query({
      database_id: db.id,
      filter: filter
    })
      .then(async (result) => {
        for (page of result.results) {
          let data = {
            page_id: page.id,
            properties: await (await attr.generateProperties(properties, _users)).properties
          }
          console.log(data)
          n_api.pages.update(data)
          // console.log("Updating page: " + page.id)
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }).catch(error => {
        console.log(error.message)
        process.exit(1);
      })
    console.log("Going through DB: " + db.id)
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}
