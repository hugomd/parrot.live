const fs = require('mz/fs');
const path = require('path');
const http = require('http');
const url = require('url');
const { Readable } = require('stream');
const colors = require('colors/safe');

// Setup frames in memory
// Load frames into memory once
let original = [];
let flipped = [];

(async () => {
  const framesPath = 'frames';
  const files = await fs.readdir(framesPath);

  original = await Promise.all(files.map(async (file) => {
    const frame = await fs.readFile(path.join(framesPath, file));
    return frame.toString();
  }));
  flipped = original.map(f => {
    return f
      .toString()
      .split('')
      .reverse()
      .join('')
  })
})().catch((err) => {
  console.log('Error loading frames');
  console.log(err);
});

const colorsOptions = [
  'red',
  'yellow',
  'green',
  'blue',
  'magenta',
  'cyan',
  'white'
];
const numColors = colorsOptions.length;
const selectColor = previousColor => {
  let color;

  do {
    color = Math.floor(Math.random() * numColors);
  } while (color === previousColor);

  return color;
};

function streamer(stream, opts) {
  const frames = opts.flip ? flipped : original;
  let index = 0;
  let lastColor;
  let timer;

  function tick() {
    // clear screen
    stream.push('\u001b[2J\u001b[3J\u001b[H');

    // color frame
    const colorIdx = lastColor = selectColor(lastColor);
    const coloredFrame = colors[colorsOptions[colorIdx]](frames[index]);

    // try to push; respect backpressure
    const ok = stream.push(coloredFrame);
    index = (index + 1) % frames.length;

    if (ok) {
      timer = setTimeout(tick, 70);
    } else {
      stream.once('drain', () => {
        timer = setTimeout(tick, 70);
      });
    }
  }

  // start
  tick();

  // cleanup function
  return () => {
    clearTimeout(timer);
  };
}

const validateQuery = ({ flip }) => ({ flip: String(flip).toLowerCase() === 'true' });

const server = http.createServer((req, res) => {
  // Healthcheck route
  if (req.url === '/healthcheck') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok' }));
  }

  if (
    req.headers &&
    req.headers['user-agent'] &&
    !req.headers['user-agent'].includes('curl')
  ) {
    res.writeHead(302, { Location: 'https://github.com/hugomd/parrot.live' });
    return res.end();
  }

  const stream = new Readable({ read() {} });
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  stream.pipe(res);

  // Start streaming with cleanup handler
  const opts = validateQuery(url.parse(req.url, true).query);
  const cleanupLoop = streamer(stream, opts);

  // Clean up when the client disconnects
  const onClose = () => {
    cleanupLoop();
    stream.destroy();
  };
  res.on('close', onClose);
  res.on('error', onClose);
});

const port = process.env.PARROT_PORT || 3000;
server.listen(port, err => {
  if (err) throw err;
  console.log(`Listening on http://localhost:${port}`);
});

