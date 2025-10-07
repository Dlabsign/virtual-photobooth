import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import basicSsl from '@vitejs/plugin-basic-ssl'; // <-- Impor plugin


// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Mengaktifkan akses dari jaringan luar
    host: true,
    // Anda juga bisa menentukan port jika port default (5173) sudah terpakai
    // port: 3000, 
    // https: true,
  }

})
