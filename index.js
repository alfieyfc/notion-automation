const { Client, LogLevel } = require("@notionhq/client")
const dotenv = require("dotenv")

dotenv.config()
const notion = new Client({
  auth: process.env.NOTION_KEY,
  logLevel: LogLevel.DEBUG,
})

const databaseId = process.env.NOTION_DATABASE_ID
const schedule_mode = process.env.NEXT_SCHEDULE
const OPERATION_BATCH_SIZE = 10

const fs = require('fs')

createPages()


async function load_config (file_path) {
  let config = await fs.promises.readFile(file_path)
  parsed_config = JSON.parse(config)
  // console.log(parsed_config)
  return parsed_config
}

async function getDue (schedule_mode, dueTime) {

}

async function getTags (tag_names) {

}

async function getUserID (user_name) {

}

async function produceData (page_info) {
  // console.log(page_info.properties.Title.title[0].text.content)
  var obj = {
    "parent": {
      "database_id": process.env.NOTION_DATABASE_ID
    },
    "properties": {
      "Title": {
        "title": [
          {
            "text": {
              "content": page_info.Title
            }
          }
        ]
        // },
        // "Due": {
        //   "date": {
        //     "start": await getDue(page_info.Due)
        //   }
      },
      "List": {
        "select": {
          "name": page_info.List
        }
      },
      "Category": {
        "select": {
          "name": page_info.Category
        }
        // },
        // "Tags": {
        //   "multi_select": await getTags(page_info.Tags)
        // },
        // "Owner": {
        //   "people": [
        //     {
        //       "id": await getUserID(page_info.Owner)
        //     }
        //   ]
      }
    }
  }
  console.log(obj)
  return obj
}

async function createPages () {

  let page_info_array = await load_config(process.env.FILE_PATH)
  // loop through array
  for (page_info of page_info_array) {
    let result = await produceData(page_info)
    notion.pages.create(result)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
