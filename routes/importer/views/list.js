const { shell, header, subheader } = require('../../../views/components');
const { sidebar } = require('./components');

const list = () => shell(`
  <div class="main">
    ${header({ currentPage: 'import' })}
    ${subheader({ currentPage: 'import' })}
    <div class="views">
      ${sidebar()}
      <div class="page" id="page">
        <h1>Import from paysite</h1>
        <form
          class="importer-form"
          action="/api/import"
          enctype="application/x-www-form-urlencoded"
          method="post"
          onsubmit="return (typeof submitted == 'undefined') ? (submitted = true) : !submitted"
        >
          <select id="service" name="service">
            <option value="patreon" selected>Patreon</option>
            <option value="fanbox">Pixiv Fanbox</option>
            <option value="gumroad">Gumroad</option>
            <option value="subscribestar">SubscribeStar</option>
            <option value="discord">Discord</option>
            <option value="dlsite">DLsite English</option>
            <option value="dlsite-jp">DLsite Japan</option>
          </select>
          <input 
            type="text"
            name="session_key"
            placeholder="session key"
            autocomplete="off" 
            autocorrect="off" 
            autocapitalize="off" 
            spellcheck="false"
            required
          >
          <input 
            type="text"
            id="channel_ids"
            name="channel_ids"
            placeholder="discord channel ids (comma separated, no spaces)"
            autocomplete="off" 
            autocorrect="off" 
            autocapitalize="off" 
            spellcheck="false"
          >
          <input type="submit"/>
        </form>
        <p>
          <a href="/importer/tutorial">Learn how to get your session key.</a><br>
          Make sure you are familiar with <a href="/help/rules">the rules</a> before importing.
          <h2>Important information</h2>
          Your session key is used to scrape paid posts from your feed. After downloading missing posts, the key is immediately discarded and never stored.
          <h3>DLsite</h3>
          <ul>
            <li>The English and Japanese versions of DLsite are separate, and have different APIs and login systems. Make sure to select the right one!</li>
            <li>As of right now, the importer is unable to crack DRM-protected works from DLsite. (extensions .dlst and .cpd) These will not be downloaded.</li>
            <li>DLsite has a short token expiration period. If your import fails, try getting a new token by logging out and back in.</li>
          </ul>
        </p>
      </div>
    </div>
  </div>
  <script src="/js/importer.js"></script>
`);

module.exports = { list };
