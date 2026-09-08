const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const outDir = path.join(rootDir, 'upload-cpanel');

console.log('🚀 Memulai proses build Next.js...');
try {
  // Jalankan next build
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
} catch (error) {
  console.error('❌ Build gagal. Silakan cek pesan error di atas.');
  process.exit(1);
}

console.log('\n📁 Menyiapkan folder upload-cpanel...');
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

console.log('📦 Menyalin file dari .next/standalone...');
const standaloneDir = path.join(rootDir, '.next', 'standalone');
if (!fs.existsSync(standaloneDir)) {
  console.error('❌ Folder .next/standalone tidak ditemukan. Pastikan output: "standalone" ada di next.config.ts');
  process.exit(1);
}
fs.cpSync(standaloneDir, outDir, { recursive: true });

console.log('🖼️ Menyalin folder public...');
const publicDir = path.join(rootDir, 'public');
const outPublicDir = path.join(outDir, 'public');
if (fs.existsSync(publicDir)) {
  fs.cpSync(publicDir, outPublicDir, { recursive: true });
}

console.log('⚡ Menyalin folder .next/static...');
const staticDir = path.join(rootDir, '.next', 'static');
const outStaticDir = path.join(outDir, '.next', 'static');
if (fs.existsSync(staticDir)) {
  fs.cpSync(staticDir, outStaticDir, { recursive: true });
}

console.log('🔑 Menyalin .env.local menjadi .env (jika ada)...');
const envLocalPath = path.join(rootDir, '.env.local');
const envOutPath = path.join(outDir, '.env');
if (fs.existsSync(envLocalPath)) {
  fs.copyFileSync(envLocalPath, envOutPath);
}

console.log('\n✅ SELESAI!');
console.log('Semua file siap di-upload ke cPanel.');
console.log(`Buka folder: ${outDir}`);
console.log('Upload SELURUH ISI dari folder tersebut (bukan foldernya) ke root aplikasi Node.js di cPanel Anda.');
console.log('Pada cPanel, pastikan Application Startup File diisi dengan: server.js');
