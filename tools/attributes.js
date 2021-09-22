const mode = process.env.SCHEDULE_MODE

const moment = require("moment")

async function getOwnerIDs (_assignees, _users) {
  var owners = []
  for (assignee of _assignees) {
    var match = await _users.find(o => o.name === assignee)
    obj = {
      "id": match.id
    }
    owners.push(obj)
  }
  return owners
}

function getDue (dueTime) {
  if (mode === 'Monthly') {
    // Add tasks for NEXT month
    target_year = moment().year()
    target_month = moment().month() + 1 + 1
    // Check for January
    if (target_month > 12) {
      target_year = moment().year() + 1
      target_month = 1
    }
    // Check for Februrary
    if (target_month === 2) {
      if (parseInt(dueTime.substr(0, 2)) > 28) {
        dueTime = "28" + dueTime.substring(2)
      }
    }

    // Require dueTime to be in format 'DD, HH:mm'
    dt_str = target_year + "/" + target_month + "/" + dueTime
    schedule = moment(dt_str, "YYYY/MM/DD, HH:mm")
  }
  else if (mode == 'Weekly') {
    // TODO: catch invalid dueTime (ex. "33:33")
    dueTimeParsed = dueTime.split(',')
    time = moment(dueTimeParsed[1], "HH:mm")

    dayOfWeek = dueTimeParsed[0].toUpperCase()
    //  - Next occurring day of week (including today): 'N', 'M', 'T', 'W', 'R', 'F', 'S'
    if (dayOfWeek.substr(0, 3) == 'SUN')
      dayOfWeek = 'N'
    if (dayOfWeek.substr(0, 3) == 'THU')
      dayOfWeek = 'R'

    switch (dayOfWeek.charAt(0)) {
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
        console.log("Unsupported weekday format. Should be \"<day_of_week>, HH:mm\", ex. \"Sunday, 11:30\"")
        console.log("Setting due date to today.")
        schedule = time
        break;
    }
  }
  else {
    console.log("Unsupported mode. Should be one of: Monthly, Weekly, Daily (default: Daily).")
    console.log("Setting due date to today.")
    return moment(dueTime, "HH:mm")
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

function getDateToday () {
  return moment().startOf('day').format("YYYY-MM-DD")
}

module.exports = {
  generateFilter: async function (_filters) {
    const obj = await Object.entries(_filters).reduce(async (accumP, [key, value]) => {
      const accum = await accumP;
      for (filter of value) {
        for (pKey of Object.keys(filter)) {
          // TODO: switch all property types
          switch (pKey) {
            case 'date':
              date_key = Object.keys(filter.date)[0]
              // TODO: switch all date properties
              switch (filter.date[date_key]) {
                case 'today':
                  filter.date[date_key] = moment().format('YYYY-MM-DD')
                  break;
                default:
                  break;
              }
              break;
            default:
              break;
          }
        }
      }
      accum[key] = value
      return accum
    }, Promise.resolve({}))
    return obj
  },
  generateProperties: async function (_properties_config, _users) {
    const obj = await Object.entries(_properties_config).reduce(async (accumP, [key, value]) => {
      const accum = await accumP;
      switch (value.type) {
        case "title":
          accum.properties[key] = { "title": [{ "text": { "content": value.data } }] }
          break
        case "date":
          if (!value.data)
            accum.properties[key] = { "date": { "start": getDateToday() } }
          else if (value.data == "empty")
            accum.properties[key] = { "date": null }
          else {
            d = moment(value.data)
            if (d.isValid())
              accum.properties[key] = { "date": { "start": d } }
            else {
              accum.properties[key] = { "date": null }
              console.log("\nInvalid data for type 'date'...\n")
            }
          }
          break
        case "select":
          if (value.data)
            accum.properties[key] = { "select": { "name": value.data } }
          else
            accum.properties[key] = { "select": null }
          break
        case "multi_select":
          accum.properties[key] = { "multi_select": getTags(value.data) }
          break
        case "people":
          accum.properties[key] = { "people": await getOwnerIDs(value.data, _users) }
          break
        case "number":
          accum.properties[key] = { "number": parseInt(value.data) }
          break;
        default:
          console.log(value.type, " is unsupported.")
          break;
      }
      return accum
    }, Promise.resolve({ properties: {} }))
    // console.log(obj)
    return obj
  },
  generatePageObject: async function (_database, _page, _users) {

    const obj = await Object.entries(_page).reduce(async (accumP, [key, value]) => {
      const accum = await accumP;
      accum.parent.database_id = _database
      switch (value.type) {
        case "title":
          accum.properties[key] = { "title": [{ "text": { "content": value.data } }] }
          break
        case "date":
          accum.properties[key] = { "date": { "start": getDue(value.data) } }
          break
        case "select":
          accum.properties[key] = { "select": { "name": value.data } }
          break
        case "multi_select":
          accum.properties[key] = { "multi_select": getTags(value.data) }
          break
        case "people":
          accum.properties[key] = { "people": await getOwnerIDs(value.data, _users) }
          break
        case "number":
          accum.properties[key] = { "number": parseInt(value.data) }
          break;
        default:
          console.log(value.type, " is unsupported.")
          break;
      }
      return accum
    }, Promise.resolve({ parent: {}, properties: {} }))

    return obj
  }
}
