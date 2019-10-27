const fs = require('mz/fs');
const path = require('path');
const http = require('http');
const url = require('url');
const { Readable } = require('stream');
const colors = require('colors/safe');

// Setup frames in memory
const allFrames = {};

const loadParrots = async (parrot='parrot') => {
  const framesPath = `frames`;
  const parrots = await fs.readdir(framesPath);

  await Promise.all(parrots.map(async parrot => {
    const files = await fs.readdir(`${framesPath}/${parrot}`);
    allFrames[parrot] = await Promise.all(files.map(async (file) => {
      const frame = await fs.readFile(path.join(framesPath, parrot, file));
      return frame.toString();
    }));
  }));
}

loadParrots().catch((err) => {
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

const streamer = (stream, parrot='parrot') => {
  let index = 0;
  let lastColor;
  let frame = null;
  const frames = allFrames[parrot || 'parrot'];

  return setInterval(() => {
    // clear the screen
    stream.push('\033[2J\033[3J\033[H');
    stream.push(frames[index]);

    index = (index + 1) % frames.length;
  }, 70);
};


const server = http.createServer((req, res) => {
  if (req.url === '/healthcheck') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({status: 'ok'}));
  }

  if (
    req.headers &&
    req.headers['user-agent'] &&
    !req.headers['user-agent'].includes('curl')
  ) {    
    res.writeHead(302, { Location: 'https://github.com/hugomd/parrot.live' });
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.path === '/list') {
    res.writeHead(200);
    const availableParrots = Object.keys(allFrames).sort()
                                   .filter(parrot => parrot !== 'parrot')
                                   .map((parrot, i) => {
      let ret = (parrot.replace('parrot', '') + ' '.repeat(25)).substr(0,24);
      if ((i+1)%5 ===0) {
        ret += '\n\t';
      }
      return ret;
    });
    res.end(`Available parrots:
\t${availableParrots.join('')}

Specify a parrot in the url:
\t curl parrot.live/football
    `);
    return;
  }

  const [,parrot] = parsedUrl.path.match(/\/(.*)/);
  if (parrot && !allFrames[parrot]) {
    res.writeHead(404);
    res.end(`Parrot not found: ${parrot}\n Try parrot.live/list to see all available parrots.\n`);
    return;
  }
  
  const stream = new Readable();
  stream._read = function noop() {};
  stream.pipe(res);
  const interval = streamer(stream, parrot);

  req.on('close', () => {
    stream.destroy();
    clearInterval(interval);
  });
});

const port = process.env.PARROT_PORT || 3000;
server.listen(port, err => {
  if (err) throw err;
  console.log(`Listening on localhost:${port}`);
});
