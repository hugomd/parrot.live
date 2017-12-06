const fs = require('mz/fs');
const http = require('http');
const {Readable} = require('stream');
const colors = require('colors/safe');

const frames = [];

// Setup frames in memory
fs.readdir('./frames').then(data => { 
  data.forEach(async frame => {
    const f = await fs.readFile(`./frames/${frame}`);
    frames.push(f.toString());
  })
});

const colorsOptions = ['red', 'yellow', 'green', 'blue', 'magenta', 'cyan', 'white'];

const streamer = stream => {
  let index = 0;
  return setInterval(() => {
    if (index > frames.length) index = 0; stream.push('\033c');
    const c = colorsOptions[Math.floor(Math.random() * colorsOptions.length)];
    stream.push(colors[c](frames[index]));
    index++;
  }, 70);
}

const server = http.createServer((req, res) => {
  if (req.headers && req.headers['user-agent'] && !req.headers['user-agent'].includes('curl')) {
    res.writeHead(302, {'Location': 'https://twitter.com/hugojmd'});
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
