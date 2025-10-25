const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function setupCors() {
  try {
    // Create cors.json file
    const corsConfig = `[
  {
    "origin": ["http://localhost:5173"],
    "method": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "maxAgeSeconds": 3600
  }
]`;
    
    const fs = require('fs');
    fs.writeFileSync('cors.json', corsConfig);
    
    console.log('Created cors.json file');
    
    // Check if gsutil is installed
    try {
      await execAsync('gsutil --version');
    } catch (error) {
      console.error('gsutil is not installed. Please install Google Cloud SDK to continue.');
      console.log('Download from: https://cloud.google.com/sdk/docs/install');
      process.exit(1);
    }
    
    // Set CORS configuration
    console.log('Setting CORS configuration...');
    const { stdout, stderr } = await execAsync('gsutil cors set cors.json gs://texconnect-16675.appspot.com');
    
    if (stderr) {
      console.error('Error setting CORS:', stderr);
    } else {
      console.log('Successfully set CORS configuration!');
      console.log('You may need to wait a few minutes for the changes to take effect.');
    }
    
    // Clean up
    fs.unlinkSync('cors.json');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

setupCors();
