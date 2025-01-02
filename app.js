const innerSelector = "div._a6-p > div > div:nth-child(1) > a";

document.addEventListener("DOMContentLoaded", function () {
  const processButton = document.getElementById("processButton");
  processButton.addEventListener("click", handleFiles);
});

function handleFiles() {
  const followersFileInput = document.getElementById('followersFile');
  const followingFileInput = document.getElementById('followingFile');
  const additionalFileInput = document.getElementById('additionalFile');
  const followersFiles = followersFileInput.files;
  const followingFiles = followingFileInput.files;
  const additionalFiles = additionalFileInput.files;

  if (followersFiles.length !== 1 || followingFiles.length !== 1 || additionalFiles.length !== 1) {
    console.log("Please select all three files.");
    return;
  }

  const followersFile = followersFiles[0];
  const followingFile = followingFiles[0];
  const additionalFile = additionalFiles[0];

  const followersPromise = readFileAsText(followersFile);
  const followingPromise = readFileAsText(followingFile);
  const additionalPromise = readFileAsText(additionalFile);

  Promise.all([followersPromise, followingPromise, additionalPromise])
    .then(results => {
      const followersData = extractData(results[0], innerSelector);
      const followingData = extractData(results[1], innerSelector);
      const additionalData = extractData(results[2], innerSelector);

      const notFollowingBack = followingData.filter(user => !followersData.includes(user));
      const finalList = notFollowingBack.filter(user => !additionalData.includes(user));

      const notFollowingBackHtml = createStyledHtml(finalList, 'Not Following Back');
      openInBrowser(notFollowingBackHtml);
    })
    .catch(error => {
      console.error("Error occurred while reading files or generating results:", error);
    });
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      resolve(e.target.result);
    };
    reader.onerror = function (e) {
      reject(e.target.error);
    };
    reader.readAsText(file);
  });
}

function extractData(htmlContent, innerSelector) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  const elements = Array.from(doc.querySelectorAll(innerSelector));
  const data = elements.map(el => `https://www.instagram.com/${el.innerHTML.trim()}`);

  return data;
}

function createStyledHtml(data, title) {
  const listItemsHtml = data.map(url => `
    <li style="margin-bottom: 10px; display: flex; align-items: center;">
      <input type="checkbox" style="margin-right: 10px;" data-url="${url}" onclick="moveToBottom(this); updateStatusCards();">
      <a href="${url}" target="_blank" style="text-decoration: none; color: #00376b;">${url}</a>
    </li>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background-color: #fafafa;
          color: #262626;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border: 1px solid #dbdbdb;
          border-radius: 3px;
          overflow: hidden;
        }
        .header {
          background-color: #fafafa;
          border-bottom: 1px solid #dbdbdb;
          padding: 10px 20px;
          text-align: center;
          font-size: 24px;
          font-weight: bold;
        }
        .content {
          padding: 20px;
        }
        #searchBar {
          width: 100%;
          padding: 10px;
          margin-bottom: 20px;
          border: 1px solid #dbdbdb;
          border-radius: 3px;
          font-size: 16px;
        }
        .status-cards {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .status-card {
          flex: 1;
          margin: 0 10px;
          padding: 10px;
          background-color: #f5f5f5;
          border: 1px solid #dbdbdb;
          border-radius: 5px;
          text-align: center;
          font-size: 16px;
          font-weight: bold;
        }
      </style>
    </head>
    <body onload="restoreCheckboxState(); updateStatusCards();">
      <div class="container">
        <div class="header">${title}</div>
        <div class="status-cards">
          <div class="status-card" id="totalUsers">Total: 0</div>
          <div class="status-card" id="checkedUsers">Checked: 0</div>
          <div class="status-card" id="uncheckedUsers">Unchecked: 0</div>
        </div>
        <div class="content">
          <input type="text" id="searchBar" placeholder="Search...">
          <ul id="userList">
            ${listItemsHtml}
          </ul>
        </div>
      </div>
      <script>
        function moveToBottom(checkbox) {
          const li = checkbox.parentElement;
          const ul = li.parentElement;
          ul.removeChild(li);
          ul.appendChild(li);
          saveCheckboxState();
        }

        function saveCheckboxState() {
          const checkboxes = document.querySelectorAll('input[type="checkbox"]');
          const checkedItems = [];
          checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
              checkedItems.push(checkbox.getAttribute('data-url'));
            }
          });
          localStorage.setItem('checkedItems', JSON.stringify(checkedItems));
        }

        function restoreCheckboxState() {
          const checkedItems = JSON.parse(localStorage.getItem('checkedItems')) || [];
          const checkboxes = document.querySelectorAll('input[type="checkbox"]');
          checkboxes.forEach(checkbox => {
            if (checkedItems.includes(checkbox.getAttribute('data-url'))) {
              checkbox.checked = true;
              moveToBottom(checkbox);
            }
          });
        }

        function updateStatusCards() {
          const checkboxes = document.querySelectorAll('input[type="checkbox"]');
          const total = checkboxes.length;
          const checked = Array.from(checkboxes).filter(checkbox => checkbox.checked).length;
          const unchecked = total - checked;

          document.getElementById('totalUsers').innerText = `Total: ${total}`;
          document.getElementById('checkedUsers').innerText = `Checked: ${checked}`;
          document.getElementById('uncheckedUsers').innerText = `Unchecked: ${unchecked}`;
        }

        document.getElementById('searchBar').addEventListener('input', function() {
          const filter = this.value.toLowerCase();
          const listItems = document.getElementById('userList').getElementsByTagName('li');
          for (let i = 0; i < listItems.length; i++) {
            const a = listItems[i].getElementsByTagName('a')[0];
            const textValue = a.textContent || a.innerText;
            if (textValue.toLowerCase().indexOf(filter) > -1) {
              listItems[i].style.display = "";
            } else {
              listItems[i].style.display = "none";
            }
          }
        });
      </script>
    </body>
    </html>
  `;
}

function openInBrowser(htmlContent) {
  const newWindow = window.open();
  newWindow.document.open();
  newWindow.document.write(htmlContent);
  newWindow.document.close();
}
