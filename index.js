const dotenv = require("dotenv")

dotenv.config()


const env_mode = process.env.MODE
const env_pages_path = process.env.PAGES_PATH
const env_delete_path = process.env.DELETE_PATH
const env_users_path = process.env.USERS_PATH

const attr = require("./tools/attributes")
const utils = require("./tools/utils")
const n_api = require("./tools/notion-api")

// Authenticate Notion
n_api.auth(process.env.NOTION_KEY, "DEBUG")

main()

async function main () {
  // Run under specified MODE.
  console.log("Running under " + env_mode + " mode.")
  switch (env_mode) {
    case ("create"):
      users = await utils.load_config(env_users_path)
      console.log("File user.json loaded.")
      pages = await utils.load_config(env_pages_path)
      console.log("File pages.json loaded.")
      createPages(users, pages)
      break;
    case ("delete"):
      deletePages(deletions)
      break;
    case ("update"):
      updatePages(pages)
      break;
    default:
      console.log("Unrecognized MODE.")
      break;
  }
}


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

function deletePages (deletions) {
  console.log(deletions)
}

function updatePages (users, objects) {

}
