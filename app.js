const innerSelector = "div._a6-p > div > div:nth-child(1) > a";

document.addEventListener("DOMContentLoaded", function () {
  const processButton = document.getElementById("processButton");
  processButton.addEventListener("click", handleFiles);
});

function handleFiles() {
  const followersFileInput = document.getElementById('followersFile');
  const followingFileInput = document.getElementById('followingFile');
  const followersFiles = followersFileInput.files;
  const followingFiles = followingFileInput.files;

  if (followersFiles.length !== 1 || followingFiles.length !== 1) {
    console.log("Please select both files.");
    return;
  }

  const followersFile = followersFiles[0];
  const followingFile = followingFiles[0];

  const followersPromise = readFileAsText(followersFile);
  const followingPromise = readFileAsText(followingFile);

  Promise.all([followersPromise, followingPromise])
    .then(results => {
      const followersData = extractData(results[0], innerSelector);
      const followingData = extractData(results[1], innerSelector);

      const followersHtml = createStyledHtml(followersData, 'Followers');
      const followingHtml = createStyledHtml(followingData, 'Following');

      const notFollowingBack = followingData.filter(user => !followersData.includes(user));
      const notFollowingBackHtml = createStyledHtml(notFollowingBack, 'Not Following Back');

      downloadResult(followersHtml, 'followers.html');
      downloadResult(followingHtml, 'following.html');
      downloadResult(notFollowingBackHtml, 'not_following_back.html');
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
  const linksHtml = data.map(url => `<a href="${url}" target="_blank" style="display: block; padding: 10px; text-decoration: none; color: #00376b;">${url}</a>`).join('');

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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">${title}</div>
        <div class="content">
          ${linksHtml}
        </div>
      </div>
    </body>
    </html>
  `;
}

function downloadResult(htmlContent, fileName) {
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);

  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}