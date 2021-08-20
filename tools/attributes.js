const mode = process.env.SCHEDULE_MODE
const utcoffset = parseInt(process.env.SCHEDULE_UTC_OFFSET)

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
    schedule = moment(dt_str, "YYYY/MM/DD, HH:mm").subtract({ hours: utcoffset }).utcOffset(utcoffset)
  } else {
    // TODO: catch invalid dueTime (ex. "33:33")
    time = moment(dueTime, "HH:mm").subtract({ hours: utcoffset }).utcOffset(utcoffset)
    mode_upper = mode.toUpperCase()
    //  - Next occurring day of week (including today): 'N', 'M', 'T', 'W', 'R', 'F', 'S'
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

module.exports = {
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
          // accum.properties[key] = { value, type: typeof value }
          break;
      }
      return accum
    }, Promise.resolve({ parent: {}, properties: {} }))

    return obj
  }
}
