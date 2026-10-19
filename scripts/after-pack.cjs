const fs = require('node:fs');
const path = require('node:path');

exports.default = async function afterPack(context) {
  const sandbox = path.join(context.appOutDir, 'chrome-sandbox');
  if (fs.existsSync(sandbox)) fs.chmodSync(sandbox, 0o4755);
};
