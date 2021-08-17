const { Client, LogLevel } = require("@notionhq/client")
const dotenv = require("dotenv")

dotenv.config()
const notion = new Client({
  auth: process.env.NOTION_KEY,
  logLevel: LogLevel.DEBUG,
})

const databaseId = process.env.NOTION_DATABASE_ID
const mode = process.env.SCHEDULE_MODE
const utcoffset = parseInt(process.env.SCHEDULE_UTC_OFFSET)
const config_path = process.env.CONFIG_PATH
const users_path = process.env.USERS_PATH
const OPERATION_BATCH_SIZE = 10

const fs = require('fs')
const moment = require("moment")

createPages()


async function load_config (file_path) {
  let config = await fs.promises.readFile(file_path)
  parsed_config = JSON.parse(config)
  // console.log(parsed_config)
  return parsed_config
}

function getDue (dueTime) {
  if (!isNaN(mode) && mode !== '') {
    console.log("Numeric Mode.")
    mode_numeric = parseInt(mode)
    // Date of month in current month: integer '1', '2', ..., or '31'
    dt_str = mode_numeric + " " + dueTime
    // TODO: catch invalid dt_str
    schedule = moment(dt_str, "DD HH:mm").subtract({ hours: utcoffset }).utcOffset(utcoffset)
  } else {
    // TODO: catch invalid dueTime
    time = moment(dueTime, "HH:mm").subtract({ hours: utcoffset }).utcOffset(utcoffset)
    mode_upper = mode.toUpperCase()
    //  - Next occuring day of week (including today): 'N', 'M', 'T', 'W', 'R', 'F', 'S'
    if (mode_upper.substr(0, 3) == 'SUN')
      mode_upper = 'N'
    if (mode_upper.substr(0, 3) == 'THU')
      mode_upper = 'R'
    switch (mode_upper.charAt(0)) {
      case 'N':
        if (moment().weekday() > 0)
          schedule = time.day(7)
        else
          schedule = time.day(0)
        break;
      case 'M':
        if (moment().weekday() > 1)
          schedule = time.day(8)
        else
          schedule = time.day(1)
        break;
      case 'T':
        if (moment().weekday() > 2)
          schedule = time.day(9)
        else
          schedule = time.day(2)
        break;
      case 'W':
        if (moment().weekday() > 3)
          schedule = time.day(10)
        else
          schedule = time.day(3)
        break;
      case 'R':
        if (moment().weekday() > 4)
          schedule = time.day(11)
        else
          schedule = time.day(4)
        break;
      case 'F':
        if (moment().weekday() > 5)
          schedule = time.day(12)
        else
          schedule = time.day(5)
        break;
      case 'S':
        if (moment().weekday() > 6)
          schedule = time.day(13)
        else
          schedule = time.day(6)
        break;
      default:
        schedule = time
        break;
    }
  }
  return schedule.format()
}

function getTags (tag_names) {
  var tags = []
  for (tag_name of tag_names) {
    obj = {
      "name": tag_name
    }
    tags.push(obj)
  }
  return tags
}

async function getUserID (assignees, users) {
  var owners = []
  for (assignee of assignees) {
    var match = await users.find(o => o.name === assignee)
    obj = {
      "id": match.id
    }
    owners.push(obj)
  }
  return owners
}

async function produceData (page_info, users) {
  var obj = {
    "parent": {
      "database_id": databaseId
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
      },
      "Due": {
        "date": {
          "start": getDue(page_info.Due)
        }
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
      },
      "Tags": {
        "multi_select": getTags(page_info.Tags)
      },
      "Owner": {
        "people": await getUserID(page_info.Owners, users)
      }
    }
  }
  return obj
}

async function createPages () {

  let user_array = await load_config(users_path)
  let page_info_array = await load_config(config_path)
  // loop through array
  for (page_info of page_info_array) {
    let result = await produceData(page_info, user_array)
    notion.pages.create(result)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
