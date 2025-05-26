let groups = {}
let currentUrls = []

// DOM Elements
const groupInput = document.getElementById("groupName")
const urlInput = document.getElementById("urlInput")
const addUrlBtn = document.getElementById("addUrl")
const saveBtn = document.getElementById("saveGroup")
const groupList = document.getElementById("groupList")
const urlList = document.getElementById("urlList")
const exportBtn = document.getElementById("exportBtn")
const importBtn = document.getElementById("importBtn")
const importFile = document.getElementById("importFile")
const infoBtn = document.getElementById("infoBtn")

// Import gsap (assuming it's available globally or via a module loader)
// If using a module loader (e.g., Webpack, Parcel), use: import gsap from 'gsap';
// For this example, we'll assume it's globally available.

// Event Listeners
addUrlBtn.addEventListener("click", addUrl)
saveBtn.addEventListener("click", saveGroup)
exportBtn.addEventListener("click", exportGroups)
importBtn.addEventListener("click", () => importFile.click())
importFile.addEventListener("change", importGroups)
infoBtn.addEventListener("click", showInfo)

// Allow Enter key to add URL
urlInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    addUrl()
  }
})

// Allow Enter key to save group
groupInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && currentUrls.length > 0) {
    saveGroup()
  }
})

function addUrl() {
  const url = urlInput.value.trim()
  if (!url) return

  // Simple URL validation
  if (!isValidUrl(url)) {
    gsap.fromTo(urlInput, { x: -10 }, { x: 10, duration: 0.1, repeat: 2, yoyo: true })
    return
  }

  currentUrls.push(url)
  urlInput.value = ""
  renderUrlList()
  updateSaveButton()

  // Animation
  gsap.fromTo(addUrlBtn, { scale: 0.8 }, { scale: 1, duration: 0.2 })
}

function removeUrl(index) {
  currentUrls.splice(index, 1)
  renderUrlList()
  updateSaveButton()
}

function renderUrlList() {
  urlList.innerHTML = ""
  currentUrls.forEach((url, index) => {
    const urlItem = document.createElement("div")
    urlItem.className = "url-item"
    urlItem.innerHTML = `
      <span class="url-text">${url}</span>
      <button class="remove-url" onclick="removeUrl(${index})">
        <i class='bx bx-x'></i>
      </button>
    `
    urlList.appendChild(urlItem)
  })
}

function updateSaveButton() {
  const hasName = groupInput.value.trim().length > 0
  const hasUrls = currentUrls.length > 0
  saveBtn.disabled = !(hasName && hasUrls)
}

function saveGroup() {
  const name = groupInput.value.trim()
  if (!name || currentUrls.length === 0) return

  groups[name] = currentUrls.slice()
  chrome.storage.local.set({ groups })

  // Reset form
  groupInput.value = ""
  currentUrls = []
  renderUrlList()
  updateSaveButton()
  renderGroups()

  // Animation
  gsap.fromTo(saveBtn, { scale: 0.9 }, { scale: 1, duration: 0.2 })
  saveBtn.classList.add("pulse")
  setTimeout(() => saveBtn.classList.remove("pulse"), 300)
}

function renderGroups() {
  const groupNames = Object.keys(groups)

  if (groupNames.length === 0) {
    groupList.innerHTML = `
      <div class="empty-state">
        <i class='bx bx-folder-open'></i>
        <h4>Aucun groupe créé</h4>
        <p>Créez votre premier groupe de sites web pour commencer</p>
      </div>
    `
    return
  }

  groupList.innerHTML = ""
  groupNames.forEach((name) => {
    const urls = groups[name]
    const groupCard = document.createElement("div")
    groupCard.className = "group-card"
    groupCard.innerHTML = `
      <div class="group-header">
        <div class="group-name">
          ${name}
          <span class="url-count">${urls.length} site${urls.length > 1 ? "s" : ""}</span>
        </div>
        <div class="group-actions">
          <button class="group-btn launch-btn" onclick="launchGroup('${name}')" title="Lancer le groupe">
            <i class='bx bx-play'></i>
          </button>
          <button class="group-btn delete-btn" onclick="deleteGroup('${name}')" title="Supprimer le groupe">
            <i class='bx bx-trash'></i>
          </button>
        </div>
      </div>
      <div class="group-urls">
        ${urls
        .slice(0, 2)
        .map((url) => `<div>${getDomainFromUrl(url)}</div>`)
        .join("")}
        ${urls.length > 2 ? `<div>+${urls.length - 2} autres...</div>` : ""}
      </div>
    `
    groupList.appendChild(groupCard)
  })
}

function launchGroup(name) {
  const urls = groups[name]
  if (!urls) return

  urls.forEach((url) => {
    chrome.tabs.create({ url: addProtocolIfMissing(url) })
  })

  // Animation feedback
  const launchBtn = event.target.closest(".launch-btn")
  gsap.fromTo(launchBtn, { scale: 0.8 }, { scale: 1, duration: 0.2 })
}

function deleteGroup(name) {
  if (confirm(`Êtes-vous sûr de vouloir supprimer le groupe "${name}" ?`)) {
    delete groups[name]
    chrome.storage.local.set({ groups })
    renderGroups()
  }
}

function exportGroups() {
  const blob = new Blob([JSON.stringify(groups, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "webcluster-groups.json"
  a.click()
  URL.revokeObjectURL(url)

  // Animation feedback
  gsap.fromTo(exportBtn, { scale: 0.8 }, { scale: 1, duration: 0.2 })
}

function importGroups() {
  const file = importFile.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      if (typeof data === "object" && data !== null) {
        groups = { ...groups, ...data }
        chrome.storage.local.set({ groups })
        renderGroups()

        // Animation feedback
        gsap.fromTo(importBtn, { scale: 0.8 }, { scale: 1, duration: 0.2 })
      } else {
        throw new Error("Format invalide")
      }
    } catch (err) {
      alert("Fichier invalide. Veuillez sélectionner un fichier JSON valide.")
    }
  }
  reader.readAsText(file)
}

function showInfo() {
  alert(
      "WebCluster v1.0\n\nCréez des groupes de sites web et lancez-les tous en un clic !\n\n• Ajoutez des URLs à un groupe\n• Sauvegardez vos groupes\n• Lancez tous les sites d'un groupe\n• Exportez/Importez vos configurations",
  )
}

// Utility functions
function isValidUrl(string) {
  try {
    new URL(addProtocolIfMissing(string))
    return true
  } catch (_) {
    return false
  }
}

function addProtocolIfMissing(url) {
  if (!/^https?:\/\//i.test(url)) {
    return "https://" + url
  }
  return url
}

function getDomainFromUrl(url) {
  try {
    const domain = new URL(addProtocolIfMissing(url)).hostname
    return domain.replace("www.", "")
  } catch (_) {
    return url
  }
}

// Update save button state on input
groupInput.addEventListener("input", updateSaveButton)

// Initialize
chrome.storage.local.get("groups", (data) => {
  groups = data.groups || {}
  renderGroups()
})

// Initial state
updateSaveButton()
