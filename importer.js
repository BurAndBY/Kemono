const { posts } = require('./db');
const request = require('request');
const cloudscraper = require('cloudscraper')
  .defaults({
    onCaptcha: require('./captcha')()
  });
const { workerData } = require('worker_threads');
const cd = require('content-disposition');
const Promise = require('bluebird');
const indexer = require('./indexer');
const fs = require('fs-extra');
const isImage = require('is-image');
const mime = require('mime')
const getUrls = require('get-urls');
const crypto = require('crypto');
const hasha = require('hasha');
const sanitizePostContent = async(content) => {
  // mirror and replace any inline images
  let urls = getUrls(content, {
    sortQueryParameters: false,
    stripWWW: false
  });
  await Promise.map(urls, async(val) => {
    let url = new URL(val);
    if (isImage(url.origin + url.pathname)) {
      let imageMime = mime.getType(url.origin + url.pathname);
      let filename = new Date().getTime() + '.' + mime.getExtension(imageMime);
      await fs.ensureFile(`${process.env.DB_ROOT}/inline/${filename}`);
      await new Promise(resolve => {
        try {
          request.get({url: val, encoding: null})
            .on('complete', () => {
              content = content.replace(val, `https://kemono.party/inline/${filename}`);
              resolve();
            })
            .pipe(fs.createWriteStream(`${process.env.DB_ROOT}/inline/${filename}`))
        } catch (error) {
          // ignore for now
          resolve();
        }
      })
    }
  })
  return content;
}
async function scraper(key, uri = 'https://api.patreon.com/stream?json-api-version=1.0') {
  let safeToLoop = true;
  let patreon = await cloudscraper.get(uri, {
    resolveWithFullResponse: true,
    json: true,
    headers: {
      'cookie': `session_id=${key}`
    }
  })
  if (patreon.body.data.length == 0) safeToLoop = false;
  await Promise
    .map(patreon.body.data, async(post) => {
      let attr = post.attributes;
      let rel = post.relationships;
      let cdn = 'https://kemono.party'
      let fileKey = `files/${rel.user.data.id}/${post.id}`
      let attachmentsKey = `attachments/${rel.user.data.id}/${post.id}`

      let existingPosts = await posts.find({id: post.id}).toArray();
      if (existingPosts.length && existingPosts[0].version === 1) {
        return;
      } else if (existingPosts.length && existingPosts[existingPosts.length-1].edited_at === attr.edited_at) {
        return;
      } else if (existingPosts.length && existingPosts[existingPosts.length-1].edited_at !== attr.edited_at) {
        fileKey = `files/edits/${rel.user.data.id}/${post.id}/${hasha(attr.edited_at)}`
        attachmentsKey = `files/edits/${rel.user.data.id}/${post.id}/${hasha(attr.edited_at)}`
      }

      let postDb = {
        version: 3,
        service: 'patreon',
        title: attr.title || '',
        content: await sanitizePostContent(attr.content),
        id: post.id,
        user: rel.user.data.id,
        post_type: attr.post_type,
        published_at: attr.published_at,
        edited_at: attr.edited_at,
        added_at: new Date().getTime(),
        embed: {},
        post_file: {},
        attachments: []
      };

      if (attr.post_file) {
        let filename = attr.post_file.name.replace(/ /g, '_')
        await fs.ensureFile(`${process.env.DB_ROOT}/${fileKey}/${filename}`);
        await request.get({url: attr.post_file.url, encoding: null})
          .pipe(fs.createWriteStream(`${process.env.DB_ROOT}/${fileKey}/${filename}`))
        postDb.post_file['name'] = attr.post_file.name
        postDb.post_file['path'] = `${cdn}/${fileKey}/${filename}`
      }

      if (attr.embed) {
        postDb.embed['subject'] = attr.embed.subject;
        postDb.embed['description'] = attr.embed.description;
        postDb.embed['url'] = attr.embed.url;
      }

      Promise
        .map(rel.attachments.data, async(attachment) => {
          // use content disposition
          let randomKey = crypto.randomBytes(20).toString('hex');
          await fs.ensureFile(`${process.env.DB_ROOT}/${attachmentsKey}/${randomKey}`);
          await new Promise(async(resolve) => {
            let res = await cloudscraper.get({
              url: `https://www.patreon.com/file?h=${post.id}&i=${attachment.id}`,
              followRedirect: false,
              followAllRedirects: false,
              resolveWithFullResponse: true,
              simple: false,
              headers: {
                'cookie': `session_id=${key}`
              }
            })
            request.get({url: res.headers['location'], encoding: null})
              .on('complete', async(attachmentData) => {
                let info = cd.parse(attachmentData.headers['content-disposition']);
                let filename = info.parameters.filename.replace(/ /g, '_')
                postDb.attachments.push({
                  id: attachment.id,
                  name: info.parameters.filename,
                  path: `${cdn}/${attachmentsKey}/${filename}`
                })
                await fs.rename(
                  `${process.env.DB_ROOT}/${attachmentsKey}/${randomKey}`,
                  `${process.env.DB_ROOT}/${attachmentsKey}/${filename}`
                ).catch()
                resolve()
              })
              .pipe(fs.createWriteStream(`${process.env.DB_ROOT}/${attachmentsKey}/${randomKey}`))
          })   
        })
        .then(async() => {
          await posts.insertOne(postDb)
        })
    })
  
  if (patreon.body.links.next && safeToLoop) {
    scraper(key, 'https://' + patreon.body.links.next)
  } else {
    indexer();
  }
}

scraper(workerData);