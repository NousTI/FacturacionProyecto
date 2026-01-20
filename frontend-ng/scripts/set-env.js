const fs = require('fs');
const path = require('path');

// Determine which env file to use
// Default to .env.development if not specified
const envFile = process.argv[2] === 'production' ? '.env.production' : '.env.development';
const envPath = path.resolve(__dirname, '..', envFile);

// Read the .env file
if (!fs.existsSync(envPath)) {
    console.error(`Error: Env file ${envFile} not found at ${envPath}`);
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');

// Parse simple key=value pairs
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim();
    }
});

// Construct the app.config.ts content
const isProduction = process.argv[2] === 'production';
const targetPath = path.resolve(__dirname, '..', 'src/app/core/config/app.config.ts');

const output = `export const AppConfig = {
  production: ${isProduction},
  apiUrl: '${envVars.apiUrl || ""}'
};
`;

// Ensure directory exists
const dir = path.dirname(targetPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(targetPath, output);
console.log(`Updated environment.ts using ${envFile}`);
