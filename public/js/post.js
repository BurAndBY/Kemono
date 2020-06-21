async function main () {
  const pathname = window.location.pathname.split('/');
  const resultsView = document.getElementById('results');
  let post, cache;
  switch (document.getElementsByName('service')[0].content) {
    case 'patreon': {
      const postData = await fetch(`/api/user/${pathname[2]}/post/${pathname[4]}`);
      post = await postData.json();
      const cacheData = await fetch(`/api/lookup/cache/${pathname[2]}?service=patreon`);
      cache = await cacheData.text();
      break;
    }
    default: {
      const postData = await fetch(`/api/fanbox/user/${pathname[3]}/post/${pathname[5]}`);
      post = await postData.json();
      const cacheData = await fetch(`/api/lookup/cache/${pathname[3]}?service=fanbox`);
      cache = await cacheData.text();
    }
    case 'gumroad': {
      const postData = await fetch(`/api/gumroad/user/${pathname[3]}/post/${pathname[5]}`);
      post = await postData.json();
      const cacheData = await fetch(`/api/lookup/cache/${pathname[3]}?service=gumroad`);
      cache = await cacheData.text();
      break;
    }
    case 'subscribestar': {
      const postData = await fetch(`/api/subscribestar/user/${pathname[3]}/post/${pathname[5]}`);
      post = await postData.json();
      const cacheData = await fetch(`/api/lookup/cache/${pathname[3]}?service=subscribestar`);
      cache = await cacheData.text();
    }
  }

  resultsView.innerHTML += `
    <li>
      User: <a href="../">${cache}</a>
    </li>
    <li>
      ID: <a href="">${post.id}</a>
    </li>
    <li>
      Published at: ${post.published_at}
    </li>
    <li>
      Added at: ${new Date(post.added_at).toISOString()}
    </li>
  `

  let imageTypes = {
    patreon: 'image_file',
    fanbox: 'image',
    gumroad: 'image',
    subscribestar: 'image'
  };
  let previews = '';
  if (post.post_type === imageTypes[post.service]) {
    previews += `
      <a class="fileThumb" href="${post.post_file.path}">
        <img 
          class="user-post-image" 
          data-src="${post.post_file.path}"
          src="${post.post_file.path}"
        >
      </a>
      <br>
    `;
  }

  post.attachments.map(attachment => {
    previews += (/\.(gif|jpe?g|png|webp)$/i).test(attachment.path) ? `
      <a class="fileThumb" href="${attachment.path}">
        <img 
          class="user-post-image" 
          data-src="${attachment.path}"
          src="${attachment.path}"
        >
      </a>
      <br>
    ` : `
      <a href="${attachment.path}" target="_blank">
        Download ${attachment.name}
      </a>
      <br>
    `;
  });
  
  const pageView = document.getElementById('page');
  pageView.innerHTML += `
    ${previews}
    <h1>${post.title}</h1>
    <p>${post.content}</p>
  `
}

window.onload = () => main();