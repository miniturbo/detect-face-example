const minimist = require('minimist');
const glob     = require('glob');
const fs       = require('fs');
const path     = require('path');
const crypto   = require('crypto');
const cv       = require('opencv');
const gm       = require('gm');

const IMG_WIDTH  = 32;
const IMG_HEIGHT = 32;

const args = minimist(process.argv.slice(2), {
  string: ['input', 'output'],
  alias: { i: 'input', o: 'output' },
  default: { input:  './src', output: './dist' }
});

const md5 = (str) => crypto.createHash('md5').update(str).digest('hex');

glob(`${args.input}/**/*`, (err, files) => {
  files
    .filter(file => fs.statSync(file).isFile())
    .filter(file => /.*\.jpg$/.test(file))
    .forEach((file) => {
      const ext  = path.extname(file);
      const dir  = path.dirname(file);
      const base = path.basename(file, ext);
      console.log({ext,dir,base});

      cv.readImage(`${file}`, (err, mat) => {
        mat.copy().detectObject(cv.FACE_CASCADE, {}, (err, faces) => {
          console.log(`-- ${file}`);
          console.log(`faces:  ${faces.length}`);

          faces.forEach((face, i) => {
            const width  = Math.round(face.width * 1.2);
            const height = Math.round(face.height * 1.2);
            const x      = Math.round(face.x - ((width - face.width) / 2));
            const y      = Math.round(face.y - ((height - face.height) / 2));

            console.log('info:  ', { width, height, x, y });

            const name = md5(`${dir}/${base}_${i}${ext}`);
            console.log(`output: ${args.output}/${name}${ext}`);

            const img = gm(mat.toBuffer());
            img.crop(width, height, x, y);
            img.resize(IMG_WIDTH, IMG_HEIGHT);
            img.write(`${args.output}/${name}${ext}`, (err) => {});
          });
        });
      })
    })
});
