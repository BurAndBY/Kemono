const { shell } = require('./components');

const server = () => shell(`
  <div class="discord-main">
    <div class="channels" id="channels"></div>
    <div class="messages" id="messages">
      <noscript>
        <div class="message">
          <p>You need JavaScript to view archived Discord messages.</p>
        </div>
      </noscript>
    </div>
  </div>
  <script src="https://unpkg.com/unfetch@4.1.0/polyfill/index.js"></script>
  <script src="/js/discord.js"></script>
`, { service: 'discord', compatibility: true, discord: true });

module.exports = { server };