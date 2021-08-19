const fs = require('fs')

module.exports = {
  load_config: async function (file_path) {
    let config = await fs.promises.readFile(file_path)
    parsed_config = JSON.parse(config)
    // console.log(parsed_config)
    return parsed_config
  }
}
