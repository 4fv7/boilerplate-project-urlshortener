require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const url = require('url');
const app = express();

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const urlDatabase = new Map();
let shortUrlCounter = 1;

function isValidUrl(string) {
  try {
    const newUrl = new URL(string);
    return newUrl.protocol === 'http:' || newUrl.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

app.post('/api/shorturl', function(req, res) {
  const originalUrl = req.body.url;
  
  if (!isValidUrl(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  const hostname = url.parse(originalUrl).hostname;
  
  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }
    
    if (!urlDatabase.has(originalUrl)) {
      urlDatabase.set(originalUrl, shortUrlCounter++);
    }
    
    res.json({
      original_url: originalUrl,
      short_url: urlDatabase.get(originalUrl)
    });
  });
});

app.get('/api/shorturl/:short_url', function(req, res) {
  const shortUrl = parseInt(req.params.short_url);
  
  for (let [originalUrl, storedShortUrl] of urlDatabase.entries()) {
    if (storedShortUrl === shortUrl) {
      return res.redirect(originalUrl);
    }
  }
  
  res.json({ error: 'No short URL found' });
});

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
