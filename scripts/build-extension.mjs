// scripts/build-extension.mjs
// Bundles the extension content script with esbuild

import * as esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';

const isWatch = process.argv.includes('--watch');

async function build() {
  const startTime = Date.now();
  console.log('⚡ Building Jahdar Chrome Extension (Manifest V3)...');

  try {
    const ctx = await esbuild.context({
      entryPoints: [path.resolve('extension/src/content.ts')],
      bundle: true,
      outfile: path.resolve('extension/dist/content.js'),
      format: 'iife',
      target: ['chrome100', 'firefox100'],
      platform: 'browser',
      sourcemap: true,
      minify: false,
      define: {
        'process.env.NODE_ENV': '"production"',
      },
    });

    if (isWatch) {
      await ctx.watch();
      console.log('👀 Watching for changes in extension/src/ ...');
    } else {
      await ctx.rebuild();
      await ctx.dispose();

      const stats = fs.statSync(path.resolve('extension/dist/content.js'));
      const sizeKb = (stats.size / 1024).toFixed(1);
      const elapsed = Date.now() - startTime;
      console.log(`✅ Extension bundled successfully into extension/dist/content.js (${sizeKb} KB) in ${elapsed}ms`);
    }
  } catch (err) {
    console.error('❌ Build failed:', err);
    process.exit(1);
  }
}

build();
