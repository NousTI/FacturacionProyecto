/**
 * generate-env.js
 * Lee las variables NG_* del archivo .env y genera
 * src/environments/environment.ts y environment.prod.ts
 *
 * Uso: node scripts/generate-env.js
 */

const fs = require('fs');
const path = require('path');

// ---------- Leer .env ----------
const envPath = path.resolve(__dirname, '../.env');

if (!fs.existsSync(envPath)) {
  console.error('[generate-env] ERROR: No se encontró el archivo .env en', envPath);
  process.exit(1);
}

const raw = fs.readFileSync(envPath, 'utf-8');

const vars = {};
for (const line of raw.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;       // ignorar vacías y comentarios
  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) continue;
  const key = trimmed.slice(0, eqIndex).trim();
  const value = trimmed.slice(eqIndex + 1).trim();
  if (key.startsWith('NG_')) {
    vars[key] = value;
  }
}

// ---------- Validar mínimos ----------
if (!vars['NG_API_URL']) {
  console.error('[generate-env] ERROR: La variable NG_API_URL no está definida en .env');
  process.exit(1);
}

// ---------- Generar contenido ----------
const devContent = `// Archivo generado automáticamente por scripts/generate-env.js
// NO editar a mano — modificar .env y correr npm run dev
export const environment = {
    production: false,
    apiUrl: '${vars['NG_API_URL']}'
};
`;

const prodContent = `// Archivo generado automáticamente por scripts/generate-env.js
// NO editar a mano — modificar .env y correr npm run build
export const environment = {
    production: true,
    apiUrl: '${vars['NG_API_URL']}'
};
`;

// ---------- Escribir archivos ----------
const envDir = path.resolve(__dirname, '../src/environments');

fs.mkdirSync(envDir, { recursive: true });

fs.writeFileSync(path.join(envDir, 'environment.ts'), devContent, 'utf-8');
fs.writeFileSync(path.join(envDir, 'environment.prod.ts'), prodContent, 'utf-8');

console.log('[generate-env] environment.ts y environment.prod.ts generados correctamente.');
console.log('[generate-env]   NG_API_URL =', vars['NG_API_URL']);
