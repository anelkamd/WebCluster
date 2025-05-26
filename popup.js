let groups = {};
let currentUrls = [];

const groupInput = document.getElementById('groupName');
const urlInput = document.getElementById('urlInput');
const addUrlBtn = document.getElementById('addUrl');
const saveBtn = document.getElementById('saveGroup');
const groupList = document.getElementById('groupList');
const groupsContainer = document.getElementById('groups');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');

addUrlBtn.addEventListener('click', () => {
  if (urlInput.value.trim()) {
    currentUrls.push(urlInput.value.trim());
    gsap.fromTo(urlInput, {x: -10}, {x: 0, duration: 0.2});
    urlInput.value = '';
  }
});

saveBtn.addEventListener('click', () => {
  const name = groupInput.value.trim();
  if (name && currentUrls.length > 0) {
    groups[name] = currentUrls.slice();
    chrome.storage.local.set({ groups });
    renderGroups();
    groupInput.value = '';
    currentUrls = [];
    gsap.fromTo(saveBtn, {scale: 0.8}, {scale: 1, duration: 0.2});
  }
});

function renderGroups() {
  groupList.innerHTML = '';
  for (const name in groups) {
    const div = document.createElement('div');
    div.className = 'group';
    div.innerHTML = `
      <strong>${name}</strong>
      <button onclick="launchGroup('${name}')">Lancer</button>
      <button onclick="deleteGroup('${name}')">🗑️</button>
    `;
    groupList.appendChild(div);
  }
}

function launchGroup(name) {
  const urls = groups[name];
  if (urls) {
    urls.forEach(url => chrome.tabs.create({ url }));
  }
}

function deleteGroup(name) {
  delete groups[name];
  chrome.storage.local.set({ groups });
  renderGroups();
}

exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(groups, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'webcluster-groups.json';
  a.click();
});

importBtn.addEventListener('click', () => {
  importFile.click();
});

importFile.addEventListener('change', () => {
  const file = importFile.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (typeof data === 'object') {
        groups = data;
        chrome.storage.local.set({ groups });
        renderGroups();
      }
    } catch (err) {
      alert('Fichier invalide');
    }
  };
  reader.readAsText(file);
});

chrome.storage.local.get('groups', (data) => {
  groups = data.groups || {};
  renderGroups();
});