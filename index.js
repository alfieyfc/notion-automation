const dotenv = require("dotenv")

dotenv.config()


const env_mode = process.env.MODE
const env_config_path = process.env.CONFIG_PATH
const env_users_path = process.env.USERS_PATH

const attr = require("./tools/attributes")
const utils = require("./tools/utils")
const n_api = require("./tools/notion-api")

// Authenticate Notion
n_api.auth(process.env.NOTION_KEY, "DEBUG")

// Load configuration files
loadConfigs()
  .then(({ users, objects }) => {
    // Run under specified MODE.
    console.log("Running under " + env_mode + " mode.")
    switch (env_mode) {
      case ("create"):
        createPages(users, objects)
        break;
      case ("delete"):
        deletePages(objects)
        break;
      case ("update"):
        updatePages(users, objects)
        break;
      default:
        console.log("Unrecognized MODE.")
        break;
    }
  })

function createPages (users, objects) {
  for (obj of objects) {
    let database = obj.database
    let pages = obj.pages
    for (page of pages) {
      attr.generatePageObject(database, page, users)
        .then(async (result) => {
          console.log(result)
          n_api.createPage(result)
          await new Promise(resolve => setTimeout(resolve, 1000));
        })
    }
  }
}

function deletePages (objects) {

}

function updatePages (users, objects) {

}

async function loadConfigs () {
  users = await utils.load_config(env_users_path)
  console.log("File user.json loaded.")

  objects = await utils.load_config(env_config_path)
  console.log("File pages.json loaded.")

  return { users, objects }
}
