import babel from 'rollup-plugin-babel';
import { version } from './package.json';

export default {
  input: 'src/fps-indicator.user.js',
  output: {
    file: 'dist/fps-indicator.user.js',
    format: 'iife',
  },
  plugins: [
    babel({
      babelrc: false,
      presets: [
        ['@babel/env', { modules: false }],
      ],
    }),
    {
      name: 'banner',
      renderChunk(code) {
        const banner = [
          '// ==UserScript==',
          '// @name        FPS Indicator',
          '// @author      LaySent',
          `// @version     ${version}`,
          '// @description Add a label on top left corner that lets you know current fps status',
          '// @homepage    https://github.com/laysent/fps-detector',
          '// @exclude     *',
          '// @downloadURL https://github.com/laysent/fps-detector/dist/index.user.js',
          '// @updateURL   https://raw.githubusercontent.com/laysent/fps-detector/master/dist/index.user.js',
          '// @supportURL  https://github.com/laysent/fps-detector/issues',
          '// @run-at      document-end',
          '// @license     MIT License',
          '// ==/UserScript==',
          '',
          '',
        ].join('\n');
        return banner + code;
      },
    },
  ],
};
