const fs = require('fs');
const path = require('path');

const agentsDir = path.join(__dirname, '.agents', 'workflows');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(agentsDir, function(filePath) {
  if (filePath.endsWith('.md') || filePath.endsWith('.json') || filePath.endsWith('.txt')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    let newContent = content
      .replace(/velarisId/g, 'revenactId')
      .replace(/Velaris ID/g, 'Revenact ID')
      .replace(/velaris_access_token/g, 'revenact_access_token')
      .replace(/velaris_refresh_token/g, 'revenact_refresh_token')
      .replace(/velaris_user/g, 'revenact_user')
      .replace(/admin@velaris\.io/g, 'admin@revenact.io')
      .replace(/demo@velaris\.io/g, 'demo@revenact.io')
      .replace(/Velaris Support/g, 'Revenact Support')
      .replace(/Velaris/g, 'Revenact')
      .replace(/velaris/g, 'revenact')
      .replace(/VELARIS/g, 'REVENACT');
      
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Updated', filePath);
    }
  }
});
