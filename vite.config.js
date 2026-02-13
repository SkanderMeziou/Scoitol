import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',

  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        village_game: resolve(__dirname, 'village_game/index.html'),
      },
    },
  },
})
