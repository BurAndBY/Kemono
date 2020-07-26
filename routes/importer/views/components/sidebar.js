const sidebar = () => `
  <div class="sidebar page-sidebar">
    <h1>Import Index</h1>
    <div class="results" id="results">
      <li>
        <a href="/importer">» Import from paysite</a>
      </li>
      <li>
        <a href="/importer/yiff">» Import from yiff.party</a>
      </li>
      <li>
        <a href="/importer/tutorial">» How to get your session key</a>
      </li>
    </div>
  </div>
`

module.exports = { sidebar };