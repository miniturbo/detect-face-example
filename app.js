const minimist = require('minimist');
const fs       = require('fs');
const path     = require('path');
const gm       = require('gm');
const cv       = require('opencv');

const IMG_WIDTH  = 32;
const IMG_HEIGHT = 32;

const args = minimist(process.argv.slice(2), {
  string: ['input', 'output'],
  alias: { i: 'input', o: 'output' },
  default: { input:  './src', output: './dist' }
});

fs.readdirSync(args.input)
  .filter(file => /.*\.jpg$/.test(file))
  .forEach((file) => {
    const ext  = path.extname(file);
    const base = path.basename(file, ext);
    cv.readImage(`${args.input}/${file}`, (err, mat) => {
      mat.copy().detectObject(cv.FACE_CASCADE, {}, (err, faces) => {
        console.log(`-- ${args.input}/${file}`);
        console.log(`faces: ${faces.length}`);

        faces.forEach((face, i) => {
          const width  = Math.round(face.width * 1.2);
          const height = Math.round(face.height * 1.2);
          const x      = Math.round(face.x - ((width - face.width) / 2));
          const y      = Math.round(face.y - ((height - face.height) / 2));

          console.log({ width, height, x, y });

          const img = gm(mat.toBuffer());
          img.crop(width, height, x, y);
          img.resize(IMG_WIDTH, IMG_HEIGHT);
          img.write(`${args.output}/${base}_${i}${ext}`, (err) => {});
        });
      });
    })
  });
