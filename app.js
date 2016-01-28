const minimist  = require('minimist');
const promisify = require('es6-promisify');
const glob      = require('glob');
const fs        = require('fs');
const co        = require('co');
const series    = require('co-series');
const path      = require('path');
const crypto    = require('crypto');
const cv        = require('opencv');
const gm        = require('gm');

const IMG_WIDTH  = 32;
const IMG_HEIGHT = 32;

const args = minimist(process.argv.slice(2), {
  string: ['input', 'output'],
  alias: { i: 'input', o: 'output' },
  default: { input:  './src', output: './dist' }
});

const md5 = (str) => crypto.createHash('md5').update(str).digest('hex');

const detect = function* (file) {
  try {
    const ext  = path.extname(file);
    const dir  = path.dirname(file);
    const base = path.basename(file, ext);

    const img  = gm(fs.readFileSync(file));
    const size = yield promisify(img.size.bind(img))();
    if (size.width > 640) {
      img.resize(640);
    }

    const buf   = yield promisify(img.toBuffer.bind(img))();
    const mat   = yield promisify(cv.readImage)(buf);
    const faces = yield promisify(mat.detectObject.bind(mat))(cv.FACE_CASCADE, {});
    console.log(`-- ${file}`);
    console.log(`faces:  ${faces.length}`);

    yield faces.map(series(function* (face, i) {
      const width  = Math.round(face.width * 1.2);
      const height = Math.round(face.height * 1.2);
      const x      = Math.round(face.x - ((width - face.width) / 2));
      const y      = Math.round(face.y - ((height - face.height) / 2));

      console.log('info:  ', { width, height, x, y });

      const name = md5(`${dir}/${base}_${i}${ext}`);
      const img  = gm(mat.toBuffer());
      img.crop(width, height, x, y);
      img.resize(IMG_WIDTH, IMG_HEIGHT);

      yield promisify(img.write.bind(img))(`${args.output}/${name}${ext}`);

      console.log(`output: ${args.output}/${name}${ext}`);
    }));
  } catch (ex) {
    console.error(ex);
  }
};

co(function* () {
  const files = yield promisify(glob)(`${args.input}/**/*`);
  yield files
    .filter(file => fs.statSync(file).isFile())
    .filter(file => new RegExp('.*\.jpe?g$', 'i').test(file))
    .map(series(detect));
}).catch(err => console.error(err));
