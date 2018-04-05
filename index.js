const fs = require('mz/fs');
const path = require('path');
const http = require('http');
const {Readable} = require('stream');
const colors = require('colors/safe');

// Setup frames in memory
let frames;

(async () => {
  const framesPath = 'frames';
  const files = await fs.readdir(framesPath);

  frames = await Promise.all(files.map(async (file) => {
    const frame = await fs.readFile(path.join(framesPath, file));
    return frame.toString();
  }));
})().catch((err) => {
  console.log('Error loading frames');
  console.log(err);
});

const colorsOptions = ['red', 'yellow', 'green', 'blue', 'magenta', 'cyan', 'white'];
const numColors = colorsOptions.length;

const streamer = stream => {
  let index = 0;
  let lastColor = -1;
  let newColor = 0;
  return setInterval(() => {
    if (index >= frames.length) index = 0;
    
    // clear the screen
    stream.push('\033[2J\033[H');

    newColor = Math.floor(Math.random() * numColors);

    // Reroll for a new color if it was the same as last frame
    if(newColor == lastColor) {
      newColor += (1 + Math.floor(Math.random() * (numColors - 1)));
      newColor %= numColors;
    }

    lastColor = newColor;
    stream.push(colors[colorsOptions[newColor]](frames[index]));

    index++;
  }, 70);
}

const server = http.createServer((req, res) => {
  if (req.headers && req.headers['user-agent'] && !req.headers['user-agent'].includes('curl')) {
    res.writeHead(302, {'Location': 'https://github.com/hugomd/parrot.live'});
    return res.end();
  }
  const stream = new Readable();
  stream._read = function noop () {};
  stream.pipe(res);
  const interval = streamer(stream);

  req.on('close', () => {
    stream.destroy();
    clearInterval(interval);
  });
});


const port = process.env.PARROT_PORT || 3000;
server.listen(port, err => {
  if (err) throw err;
  console.log(`Listening on locahost:${port}`);
});
