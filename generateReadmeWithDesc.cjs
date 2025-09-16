// generateReadmeWithDesc.cjs
const fs = require('fs');
const path = require('path');

// Atur deskripsi di sini
const descriptions = {
  '.git': 'Konfigurasi Git',
  'node_modules': 'Dependency yang diinstal oleh npm',
  'public': 'File statis yang bisa diakses langsung',
  'chatbot.png': 'Gambar ikon chatbot',
  'chatFresh.svg': 'Ikon chatbot tema Fresh',
  'flower1.png': 'Ilustrasi bunga untuk dekorasi UI',
  'fresh.svg': 'Ikon tema Fresh',
  'image.png': 'Gambar',
  'netral.svg': 'Ikon tema Netral',
  'Teta_girl.png': 'Ilustrasi karakter Teta (maskot)',
  'vite.svg': 'Logo Vite (framework build)',
  
  'README.md': 'Dokumentasi proyek',
  'src': 'Kode sumber utama aplikasi',
  'App.tsx': 'Komponen root React',
  'App.css': 'Style global aplikasi',
  
  'assets': 'Asset gambar tambahan',
  'bg3.png': 'Background ketiga untuk halaman',
  'chatbot.png': 'Ikon chatbot (varian lain)',
  'cloud.png': 'Ikon/gambar awan',
  'react.svg': 'Logo React',

  'components': 'Kumpulan komponen UI aplikasi',
  'admin': 'Folder komponen khusus Admin',
  'AdminDashboard.tsx': 'Halaman dashboard Admin',
  'ConfirmationPage.tsx': 'Halaman konfirmasi email/registrasi',
  'EditProfile.tsx': 'Halaman edit profil user',
  'Eksplorasi.tsx': 'Halaman eksplorasi fitur/quotes',
  'FavoriteQuotes.tsx': 'Halaman daftar quotes favorit',
  'ForgotPassword.tsx': 'Halaman lupa password',
  'Home.tsx': 'Halaman utama (setelah login)',
  'HomeTamu.tsx': 'Halaman Home untuk user tamu',
  'Login.tsx': 'Halaman login',
  'otpLogin.tsx': 'Halaman verifikasi OTP login',
  'Pertanyaan.tsx': 'Halaman pertanyaan',
  'Quotes.tsx': 'Halaman daftar quotes',
  'Registrasi.tsx': 'Halaman registrasi akun',
  'ResetPassword.tsx': 'Halaman reset password',
  'ThemeSwitcher.tsx': 'Komponen ganti tema',
  'TipsKesehatan.tsx': 'Halaman tips kesehatan',

  'context': 'Kumpulan Context API',
  'AuthContext.tsx': 'Context untuk autentikasi user',
  
  'firebase.ts': 'Konfigurasi Firebase',
  'main.tsx': 'Entry point ReactDOM.render',
  
  'themes': 'Kumpulan file tema CSS',
  'applyTheme.tsx': 'Helper untuk menerapkan tema',
  'flower.css': 'Tema Flower',
  'fresh.css': 'Tema Fresh',
  'netral.css': 'Tema Netral',

  'vite-env.d.ts': 'Deklarasi TypeScript untuk Vite',
  'tsconfig.app.json': 'Konfigurasi TypeScript untuk aplikasi',
  'tsconfig.json': 'Konfigurasi utama TypeScript',
  'tsconfig.node.json': 'Konfigurasi TypeScript untuk Node.js',
  'vite.config.ts': 'Konfigurasi Vite sebagai build tool',
  
  'eslint.config.js': 'Konfigurasi ESLint untuk linting',
  'index.html': 'Halaman HTML utama aplikasi',
  'package-lock.json': 'Lock file versi dependency',
  'package.json': 'Konfigurasi proyek dan daftar dependency',
};


// Folder yang mau di-skip dari dokumentasi
const skip = ['.git', 'node_modules'];

function generateTree(dir, prefix = '') {
  let tree = '';
  const files = fs.readdirSync(dir);

  files.forEach((file, index) => {
    if (skip.includes(file)) return;

    const filePath = path.join(dir, file);
    const isLast = index === files.length - 1;
    const stats = fs.statSync(filePath);

    const connector = isLast ? '└── ' : '├── ';
    const desc = descriptions[file] ? ` # ${descriptions[file]}` : '';

    tree += `${prefix}${connector}${file}${desc}\n`;

    if (stats.isDirectory()) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      tree += generateTree(filePath, newPrefix);
    }
  });

  return tree;
}

const treeStructure = `
## Struktur Proyek

\`\`\`
${generateTree('.')}
\`\`\`
`;

let readmeContent = fs.existsSync('README.md')
  ? fs.readFileSync('README.md', 'utf-8')
  : '';

if (!readmeContent.includes('## Struktur Proyek')) {
  readmeContent += '\n' + treeStructure;
} else {
  readmeContent = readmeContent.replace(/## Struktur Proyek[\s\S]*$/, treeStructure);
}

fs.writeFileSync('README.md', readmeContent);

console.log('README.md berhasil diperbarui dengan struktur project + deskripsi!');
