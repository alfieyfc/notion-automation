const fs = require('fs')

module.exports = {
  load_config: function (file_path) {
    return fs.promises.readFile(file_path)
      .then((content) => {
        return JSON.parse(content)
      }).catch((error) => {
        console.error(error.message);
        process.exit(1);
      })
  }
}
