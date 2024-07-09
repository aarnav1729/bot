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

      const followersTxt = createResultText(followersData);
      const followingTxt = createResultText(followingData);

      const notFollowingBack = followingData.filter(user => !followersData.includes(user));
      const notFollowingBackTxt = createResultText(notFollowingBack);

      downloadResult(followersTxt, 'followers.txt');
      downloadResult(followingTxt, 'following.txt');
      downloadResult(notFollowingBackTxt, 'not_following_back.txt');
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

function createResultText(data) {
  return data.map(url => `<a href="${url}" target="_blank">${url}</a>`).join('\n');
}

function downloadResult(resultText, fileName) {
  const blob = new Blob([resultText], { type: 'text/html' });
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