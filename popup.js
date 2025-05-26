let groups = {}
let currentUrls = []
let editingGroup = null
let draggedElement = null

// DOM Elements
const groupInput = document.getElementById("groupName")
const urlInput = document.getElementById("urlInput")
const addUrlBtn = document.getElementById("addUrl")
const saveBtn = document.getElementById("saveGroup")
const saveBtnText = document.getElementById("saveBtnText")
const groupList = document.getElementById("groupList")
const urlList = document.getElementById("urlList")
const exportBtn = document.getElementById("exportBtn")
const importBtn = document.getElementById("importBtn")
const importFile = document.getElementById("importFile")
const infoBtn = document.getElementById("infoBtn")
const createSection = document.getElementById("createSection")
const sectionTitle = document.getElementById("sectionTitle")
const cancelEditBtn = document.getElementById("cancelEditBtn")

// Simple animation functions to replace GSAP
function animate(element, fromProps, toProps, duration = 300) {
  const startTime = performance.now()
  const startProps = {}

  // Get initial values
  for (const prop in fromProps) {
    if (prop === "scale") {
      startProps[prop] = 1
      element.style.transform = `scale(${fromProps[prop]})`
    } else if (prop === "x") {
      startProps[prop] = 0
      element.style.transform = `translateX(${fromProps[prop]}px)`
    }
  }

  function step(currentTime) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)

    for (const prop in toProps) {
      const start = fromProps[prop]
      const end = toProps[prop]
      const current = start + (end - start) * progress

      if (prop === "scale") {
        element.style.transform = `scale(${current})`
      } else if (prop === "x") {
        element.style.transform = `translateX(${current}px)`
      }
    }

    if (progress < 1) {
      requestAnimationFrame(step)
    } else {
      // Reset transform if needed
      if (toProps.scale === 1 && toProps.x === 0) {
        element.style.transform = ""
      }
    }
  }

  requestAnimationFrame(step)
}

// Event Listeners
addUrlBtn.addEventListener("click", addUrl)
saveBtn.addEventListener("click", saveGroup)
exportBtn.addEventListener("click", exportGroups)
importBtn.addEventListener("click", () => importFile.click())
importFile.addEventListener("change", importGroups)
infoBtn.addEventListener("click", showInfo)
cancelEditBtn.addEventListener("click", cancelEdit)

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
    urlInput.classList.add("shake")
    setTimeout(() => urlInput.classList.remove("shake"), 500)
    return
  }

  currentUrls.push(url)
  urlInput.value = ""
  renderUrlList()
  updateSaveButton()

  // Animation
  animate(addUrlBtn, { scale: 0.8 }, { scale: 1 }, 200)
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
    urlItem.className = "url-item slide-in"
    urlItem.innerHTML = `
      <span class="url-text">${url}</span>
      <button class="remove-url" data-index="${index}">
        <i class='bx bx-x'></i>
      </button>
    `

    // Add event listener for remove button
    const removeBtn = urlItem.querySelector(".remove-url")
    removeBtn.addEventListener("click", () => removeUrl(index))

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

  if (editingGroup && editingGroup !== name) {
    // If editing and name changed, delete old group
    delete groups[editingGroup]
  }

  groups[name] = currentUrls.slice()
  chrome.storage.local.set({ groups })

  // Reset form
  resetForm()
  renderGroups()

  // Animation
  saveBtn.classList.add("bounce")
  setTimeout(() => saveBtn.classList.remove("bounce"), 600)
}

function resetForm() {
  groupInput.value = ""
  currentUrls = []
  editingGroup = null
  renderUrlList()
  updateSaveButton()

  // Reset UI to create mode
  createSection.classList.remove("edit-mode")
  sectionTitle.innerHTML = '<i class="bx bx-folder-plus"></i> Créer un groupe'
  saveBtnText.textContent = "Sauvegarder le groupe"
  cancelEditBtn.style.display = "none"
}

function cancelEdit() {
  resetForm()
}

function editGroup(name) {
  const urls = groups[name]
  if (!urls) return

  editingGroup = name
  groupInput.value = name
  currentUrls = urls.slice()

  renderUrlList()
  updateSaveButton()

  // Update UI to edit mode
  createSection.classList.add("edit-mode")
  sectionTitle.innerHTML = '<i class="bx bx-edit"></i> Modifier le groupe'
  saveBtnText.textContent = "Mettre à jour le groupe"
  cancelEditBtn.style.display = "flex"

  // Scroll to top
  document.querySelector(".container").scrollTop = 0
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
  groupNames.forEach((name, index) => {
    const urls = groups[name]
    const groupCard = document.createElement("div")
    groupCard.className = "group-card slide-in"
    groupCard.draggable = true
    groupCard.dataset.groupName = name
    groupCard.dataset.index = index

    groupCard.innerHTML = `
      <div class="group-header">
        <div class="group-name">
          <i class='bx bx-grip-vertical drag-handle'></i>
          ${name}
          <span class="url-count">${urls.length} site${urls.length > 1 ? "s" : ""}</span>
        </div>
        <div class="group-actions">
          <button class="group-btn edit-btn" data-action="edit" data-group="${name}" title="Modifier le groupe">
            <i class='bx bx-edit'></i>
          </button>
          <button class="group-btn launch-btn" data-action="launch" data-group="${name}" title="Lancer le groupe">
            <i class='bx bx-play'></i>
          </button>
          <button class="group-btn delete-btn" data-action="delete" data-group="${name}" title="Supprimer le groupe">
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

    // Add event listeners for buttons
    const editBtn = groupCard.querySelector('[data-action="edit"]')
    const launchBtn = groupCard.querySelector('[data-action="launch"]')
    const deleteBtn = groupCard.querySelector('[data-action="delete"]')

    editBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      editGroup(name)
    })

    launchBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      launchGroup(name, e.target)
    })

    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      deleteGroup(name)
    })

    // Add drag and drop event listeners
    groupCard.addEventListener("dragstart", handleDragStart)
    groupCard.addEventListener("dragover", handleDragOver)
    groupCard.addEventListener("drop", handleDrop)
    groupCard.addEventListener("dragend", handleDragEnd)

    groupList.appendChild(groupCard)
  })
}

// Drag and Drop functions
function handleDragStart(e) {
  draggedElement = this
  this.classList.add("dragging")
  e.dataTransfer.effectAllowed = "move"
  e.dataTransfer.setData("text/html", this.outerHTML)
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault()
  }

  this.classList.add("drag-over")
  e.dataTransfer.dropEffect = "move"
  return false
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation()
  }

  if (draggedElement !== this) {
    // Get the order of groups
    const groupNames = Object.keys(groups)
    const draggedIndex = Number.parseInt(draggedElement.dataset.index)
    const targetIndex = Number.parseInt(this.dataset.index)

    // Reorder the groups object
    const draggedName = groupNames[draggedIndex]
    const newGroups = {}

    groupNames.forEach((name, index) => {
      if (index === targetIndex) {
        if (draggedIndex < targetIndex) {
          newGroups[name] = groups[name]
          newGroups[draggedName] = groups[draggedName]
        } else {
          newGroups[draggedName] = groups[draggedName]
          newGroups[name] = groups[name]
        }
      } else if (index !== draggedIndex) {
        newGroups[name] = groups[name]
      }
    })

    groups = newGroups
    chrome.storage.local.set({ groups })
    renderGroups()
  }

  this.classList.remove("drag-over")
  return false
}

function handleDragEnd(e) {
  this.classList.remove("dragging")

  // Remove drag-over class from all elements
  document.querySelectorAll(".group-card").forEach((card) => {
    card.classList.remove("drag-over")
  })

  draggedElement = null
}

function launchGroup(name, buttonElement) {
  const urls = groups[name]
  if (!urls) return

  urls.forEach((url) => {
    chrome.tabs.create({ url: addProtocolIfMissing(url) })
  })

  // Animation feedback
  if (buttonElement) {
    animate(buttonElement, { scale: 0.8 }, { scale: 1 }, 200)
  }
}

function deleteGroup(name) {
  if (confirm(`Êtes-vous sûr de vouloir supprimer le groupe "${name}" ?`)) {
    delete groups[name]
    chrome.storage.local.set({ groups })

    // If we're editing this group, cancel edit
    if (editingGroup === name) {
      resetForm()
    }

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
  animate(exportBtn, { scale: 0.8 }, { scale: 1 }, 200)
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
        animate(importBtn, { scale: 0.8 }, { scale: 1 }, 200)
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
      "WebCluster v1.0\n\nCréez des groupes de sites web et lancez-les tous en un clic !\n\n• Ajoutez des URLs à un groupe\n• Sauvegardez vos groupes\n• Modifiez vos groupes existants\n• Réorganisez par glisser-déposer\n• Lancez tous les sites d'un groupe\n• Exportez/Importez vos configurations",
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
