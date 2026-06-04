const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const html = `
<!DOCTYPE html>
<html>
<head></head>
<body>
  <div id="chatArea"></div>
  <input id="chatInput" />
  <button id="sendBtn"></button>
  <div class="qa-btn"></div>
  <input id="fileUpload" />
  <input id="memberIdInput" />
  <button id="unlockBtn"></button>
</body>
</html>
`;

try {
    const dom = new JSDOM(html, { runScripts: "dangerously" });
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Mock localStorage
    const mockLocalStorage = {
      getItem: () => null,
      setItem: () => null,
      removeItem: () => null,
    };
    global.localStorage = mockLocalStorage;

    const assistantPath = path.resolve(__dirname, 'assistant.js');
    console.log('Assistant path:', assistantPath);
    const assistantCode = fs.readFileSync(assistantPath, 'utf8');

    const scriptEl = document.createElement("script");
    scriptEl.textContent = assistantCode;
    document.body.appendChild(scriptEl);

    console.log('JSDOM environment created.');
} catch (e) {
    console.error(e);
}
