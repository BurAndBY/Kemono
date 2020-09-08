const { shell, header, subheader } = require('../../../views/components');

const nu = props => shell(`
  <div class="main">
    ${header({ currentPage: 'requests' })}
    ${subheader({ currentPage: 'requests' })}
    <div class="page" id="page">
      <h1>New request</h1>
      ${props.query.service && props.query.user ? `
        <small class="subtitle">Creating request for ${props.query.service}:${props.query.user}</small>
      ` : ''}
      <form
        class="search-form"
        action="/requests/new"
        enctype="multipart/form-data"
        method="post"
        onsubmit="return (typeof submitted == 'undefined') ? (submitted = true) : !submitted"
      >
      ${props.query.service ? `
        <div>
          <input
            type="hidden"
            name="service"
            value="${props.query.service}"
          >
        </div>
      ` : `
        <div>
          <label for="service">Service</label>
          <select id="service" name="service">
            <option value="patreon">Patreon</option>
            <option value="fanbox">Pixiv Fanbox</option>
            <option value="gumroad">Gumroad</option>
            <option value="subscribestar">SubscribeStar</option>
            <option value="dlsite">DLsite</option>
          </select>
        </div>
      `}
      ${props.query.user ? `
        <div>
          <input
            type="hidden"
            name="user"
            value="${props.query.user}"
          > 
        </div>
      ` : `
        <div>
          <label for="user_id">User ID</label>
          <input
            type="text"
            name="user_id"
            id="user_id"
            autocomplete="off"
            required
          >
          <small>
            <i>Fill this field carefully.</i><br>
            <strong>How to get user IDs</strong>
            <li>The ID for already imported users is in the URL - https://kemono.party/&lt;service&gt;/&lt;type&gt;/<strong>&lt;id&gt;</strong></li>
            <li><strong>Patreon</strong>, <strong>Pixiv Fanbox</strong>, and <strong>Gumroad</strong> - drag the links into your bookmark bar and click while on the user's page.
              (<a href="javascript:window.alert(&quot;This user's ID is &quot; + window.patreon.bootstrap.campaign.data.relationships.creator.data.id + &quot;.&quot;);">Get Patreon ID</a>,
              <a href="javascript:fetch('https://api.fanbox.cc/creator.get?creatorId='+location.host.split('.')[0]).then(a=>a.json()).then(data=>window.alert(&quot;This user's ID is &quot; + data.body.user.userId + &quot;.&quot;));">Get Fanbox ID</a>,
              <a href="javascript:window.alert(&quot;This user's ID is &quot; + document.getElementsByClassName('creator-profile-card')[0].dataset.userId + &quot;.&quot;);">Get Gumroad ID</a>)
            </li>
            <details>
              <summary><i>Can't use bookmarklets?</i></summary>
              
              <li>For <strong>Patreon</strong>, run <code>window.patreon.bootstrap.campaign.data.relationships.creator.data.id</code> in the Javascript console on the artist's page.</li>
              <li>For <strong>Pixiv Fanbox</strong>, go to the Network tab in DevTools, click <i>XHR,</i> look for <i>creator.get</i> and find <strong>userId</strong>.</li>
              <li>For <strong>Gumroad</strong>, run <code>document.getElementsByClassName('creator-profile-card')[0].dataset.userId</code> in the Javascript console on the artist's page.</li>
              <br>
            </details>
            <li><strong>SubscribeStar</strong> - https://subscribestar.adult/<strong>&lt;id&gt;</strong></li>
            <li><strong>DLsite</strong> - https://www.dlsite.com/eng/circle/profile/=/maker_id/<strong>&lt;id&gt;</strong>.html</li>
          </small>
        </div>
      `}
        <div>
          <label for="title">Request Title</label>
          <input
            type="text"
            name="title"
            id="title"
            autocomplete="off"
            required
          >
          <small class="subtitle">Include things like artist name, requested tier/price, etc.</small>
        </div>
        <div for="description">
          <label>Request Description</label>
          <textarea
            name="description"
            id="description"
            maxlength="5000"
            cols="48"
            rows="4"
            wrap="soft"
            placeholder="Include any additional information..."
          ></textarea>
        </div>
        <div>
          <label for="price">Price</label>
          $<input id="price" name="price" type="number" min="0.00" max="10000.00" step="0.01" required/>
          <small class="subtitle">The minimum price of the tier/product you are requesting. 100¥ is roughly $1 USD.</small>
        </div>
        <div>
          <label>Fulfillment condition</label>
          <input type="radio" name="condition" value="any" style="margin-right:5px" onclick="handleClick(this);" checked>Any update
          <input type="radio" name="condition" value="specific" style="margin-right:5px" onclick="handleClick(this);">Specific post
          <input
            type="text"
            name="specific_id"
            id="specific_id"
            autocomplete="off"
            placeholder="Post/product ID"
          >
          <small class="subtitle">The condition needed for this request to be considered completed.</small>
        </div>
        <div>
          <label for="image">Image</label>
          <input
            id="image"
            type="file"
            name="image"
            accept="image/jpeg,image/png"
          />
          <small class="subtitle">An optional cover image. Attaching one may increase chances of people seeing your request.<br>1MB size limit</small>
        </div>
        <input type="submit" name="commit" value="Submit">
      </form>
    </div>
  </div>
  <script src="/js/request.js"></script>
`);

module.exports = { nu };
