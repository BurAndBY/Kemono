const cloudscraper = require('cloudscraper');
const request = require('request-promise');
const scrapeIt = require('scrape-it');
const { lookup } = require('../../db');
const getUrls = require('get-urls');

const express = require('express');
const router = express.Router();

router
  .get('/user/:id', (req, res) => {
    const api = 'https://www.patreon.com/api/user';
    const options = cloudscraper.defaultParams;
    options.json = true;
    cloudscraper.get(`${api}/${req.params.id}`, options)
      .then(user => {
        res.setHeader('Cache-Control', 'max-age=2629800, public, stale-while-revalidate=2592000');
        res.json(user);
      })
      .catch(() => res.sendStatus(404));
  })
  .get('/fanbox/user/:id', (req, res) => {
    const api = 'https://api.fanbox.cc/creator.get?userId';
    request.get(`${api}=${req.params.id}`, {
      json: true,
      headers: {
        origin: 'https://fanbox.cc',
        cookie: `FANBOXSESSID=${process.env.FANBOX_KEY}`
      }
    })
      .then(user => {
        res.setHeader('Cache-Control', 'max-age=2629800, public, stale-while-revalidate=2592000');
        res.json(user);
      })
      .catch(() => res.sendStatus(404));
  })
  .get('/gumroad/user/:id', async (req, res) => {
    const api = 'https://gumroad.com';
    try {
      const html = await request.get(`${api}/${req.params.id}`);
      const user = scrapeIt.scrapeHTML(html, {
        background: {
          selector: '.profile-background-container.js-background-image-container img',
          attr: 'src'
        },
        avatar: {
          selector: '.profile-picture.js-profile-picture',
          attr: 'style',
          convert: x => {
            const urls = getUrls(x, {
              sortQueryParameters: false,
              stripWWW: false
            });
            return urls.values().next().value.replace(');', '');
          }
        },
        name: 'h2.creator-profile-card__name.js-creator-name'
      });

      res.setHeader('Cache-Control', 'max-age=31557600, public, stale-while-revalidate=2592000');
      res.json(user);
    } catch (err) {
      res.sendStatus(404);
    }
  })
  .get('/subscribestar/user/:id', async (req, res) => {
    const api = 'https://subscribestar.adult';
    try {
      const html = await cloudscraper(`${api}/${req.params.id}`);
      const user = scrapeIt.scrapeHTML(html, {
        background: {
          selector: '.profile_main_info-cover',
          attr: 'src'
        },
        avatar: {
          selector: '.profile_main_info-userpic img',
          attr: 'src'
        },
        name: '.profile_main_info-name'
      });

      res.setHeader('Cache-Control', 'max-age=31557600, public, stale-while-revalidate=2592000');
      res.json(user);
    } catch (err) {
      res.sendStatus(404);
    }
  })
  .get('/discord/server/:id', async (req, res) => {
    const index = await lookup
      .find({ service: 'discord', id: req.params.id })
      .project({ name: 1, icon: 1 })
      .toArray();
    res.setHeader('Cache-Control', 'max-age=2629800, public, stale-while-revalidate=2592000');
    res.json(index);
  });

module.exports = router;