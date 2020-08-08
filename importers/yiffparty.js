const cloudscraper = require('cloudscraper');
const { posts, bans } = require('../utils/db');
const retry = require('p-retry');
const path = require('path');
const mime = require('mime');
const downloadFile = require('../download');
const Promise = require('bluebird');
const indexer = require('../init/indexer');

const sanitizePostContent = async (content) => {
  // mirror and replace any inline images
  if (!content) return '';
  const urls = content.match(/(((http|https|ftp):\/\/([\w-\d]+\.)+[\w-\d]+){0,1}(\/[\w~,;\-./?%&+#=]*))/ig) || [];
  await Promise.mapSeries(urls, async (val) => {
    if ((/\.(gif|jpe?g|png|webp)$/i).test(val) && (/\/patreon_inline\//i).test(val)) {
      const downloadUrl = val.startsWith('/') ? 'https://data.yiff.party' + val : val;
      const imageMime = mime.getType(val);
      const filename = new Date().getTime() + '.' + mime.getExtension(imageMime);
      await downloadFile({
        ddir: path.join(process.env.DB_ROOT, 'inline'),
        name: filename
      }, {
        url: downloadUrl
      })
        .then(() => {
          content = content.replace(val, `/inline/${filename}`);
        });
    }
  });
  return content;
};

async function scraper (users) {
  const userArray = users.split(',');
  await Promise.mapSeries(userArray, async (user) => {
    const yiff = await retry(() => cloudscraper.get(`https://yiff.party/${user}.json`, {
      json: true
    }));
    await Promise.map(yiff.posts, async (post) => {
      // intentionally doesn't support flags to prevent version downgrading and edit erasing
      const banExists = await bans.findOne({ id: post.id, service: 'patreon' });
      if (banExists) return;

      const postExists = await posts.findOne({
        id: String(post.id),
        $or: [
          { service: 'patreon' },
          { service: null }
        ]
      });
      if (postExists) return;

      const model = {
        id: String(post.id),
        user: user,
        service: 'patreon',
        title: post.title || '',
        content: await sanitizePostContent(post.body),
        embed: {},
        rating: 'explicit',
        shared_file: false,
        added_at: new Date().toISOString(),
        published_at: new Date(post.created * 1000).toISOString(),
        edited_at: null,
        file: {},
        attachments: [],
        tags: {
          artist: [],
          character: [],
          copyright: [],
          meta: ['tagme'],
          general: []
        }
      };

      if (Object.keys(post.embed || {}).length) {
        model.embed.subject = post.embed.subject;
        model.embed.description = post.embed.description;
        model.embed.url = post.embed.url;
      }

      if (Object.keys(post.post_file || {}).length) {
        await downloadFile({
          ddir: path.join(process.env.DB_ROOT, `files/${user}/${post.id}`),
          name: post.post_file.file_name
        }, {
          url: post.post_file.file_url
        })
          .then(res => {
            model.file.name = res.filename;
            model.file.path = `/files/${user}/${post.id}/${res.filename}`;
          });
      }

      await Promise.map(post.attachments, async (attachment) => {
        await downloadFile({
          ddir: path.join(process.env.DB_ROOT, `attachments/${user}/${post.id}`),
          name: attachment.file_name
        }, {
          url: attachment.file_url
        })
          .then(res => {
            model.attachments.push({
              name: res.filename,
              path: `/attachments/${user}/${post.id}/${res.filename}`
            });
          });
      });

      posts.insertOne(model);
    });
  });

  indexer();
}

module.exports = users => scraper(users);