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
  });
});

const selectColor = function(previousColor) {
  const colors = ['red', 'yellow', 'green', 'blue', 'magenta', 'cyan', 'white'];
  let availableColors = colors.filter(color => color !== previousColor);
  return availableColors[Math.floor(Math.random() * availableColors.length)];
}

const streamer = stream => {
  let index = 0;
  let lastColor;
  return setInterval(() => {
    let newColor;
    let clearScreen = '\033[2J\033[H';

    stream.push(clearScreen);
    lastColor = newColor = selectColor(lastColor);
    stream.push(colors[newColor](frames[index]));

    index = (index + 1) % frames.length;
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
