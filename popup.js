let groups = {}
let currentUrls = []
let editingGroup = null
let draggedElement = null
let currentGroupColor = "#667eea"
const groupTabs = {} 

const colorPresets = [
  "#667eea",
  "#764ba2",
  "#f093fb",
  "#f5576c",
  "#4facfe",
  "#00f2fe",
  "#43e97b",
  "#38f9d7",
  "#ffecd2",
  "#fcb69f",
  "#a8edea",
  "#fed6e3",
  "#ff9a9e",
  "#fecfef",
  "#ffeaa7",
  "#fab1a0",
]

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
const groupColorInput = document.getElementById("groupColor")
const colorPresetsContainer = document.getElementById("colorPresets")


function animate(element, fromProps, toProps, duration = 300) {
  const startTime = performance.now()

  for (const prop in fromProps) {
    if (prop === "scale") {
      element.style.transform = `scale(${fromProps[prop]})`
    } else if (prop === "x") {
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
      if (toProps.scale === 1 && toProps.x === 0) {
        element.style.transform = ""
      }
    }
  }

  requestAnimationFrame(step)
}


function initializeColorPresets() {
  colorPresetsContainer.innerHTML = ""
  colorPresets.forEach((color) => {
    const preset = document.createElement("div")
    preset.className = "color-preset"
    preset.style.backgroundColor = color
    preset.addEventListener("click", () => {
      currentGroupColor = color
      groupColorInput.value = color
      updateColorPresets()
    })
    colorPresetsContainer.appendChild(preset)
  })
  updateColorPresets()
}

function updateColorPresets() {
  document.querySelectorAll(".color-preset").forEach((preset) => {
    preset.classList.toggle("active", preset.style.backgroundColor === hexToRgb(currentGroupColor))
  })
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (result) {
    const r = Number.parseInt(result[1], 16)
    const g = Number.parseInt(result[2], 16)
    const b = Number.parseInt(result[3], 16)
    return `rgb(${r}, ${g}, ${b})`
  }
  return null
}

function hexToRgbValues(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (result) {
    return {
      r: Number.parseInt(result[1], 16),
      g: Number.parseInt(result[2], 16),
      b: Number.parseInt(result[3], 16),
    }
  }
  return { r: 102, g: 126, b: 234 }
}

addUrlBtn.addEventListener("click", addUrl)
saveBtn.addEventListener("click", saveGroup)
exportBtn.addEventListener("click", exportGroups)
importBtn.addEventListener("click", () => importFile.click())
importFile.addEventListener("change", importGroups)
infoBtn.addEventListener("click", showInfo)
cancelEditBtn.addEventListener("click", cancelEdit)

groupColorInput.addEventListener("change", (e) => {
  currentGroupColor = e.target.value
  updateColorPresets()
})

urlInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    addUrl()
  }
})

groupInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && currentUrls.length > 0) {
    saveGroup()
  }
})

function addUrl() {
  const url = urlInput.value.trim()
  if (!url) return

  if (!isValidUrl(url)) {
    urlInput.classList.add("shake")
    setTimeout(() => urlInput.classList.remove("shake"), 500)
    return
  }

  currentUrls.push(url)
  urlInput.value = ""
  renderUrlList()
  updateSaveButton()

  animate(addUrlBtn, { scale: 0.8 }, { scale: 1 }, 200)
}

function removeUrl(index) {
  currentUrls.splice(index, 1)
  renderUrlList()
  updateSaveButton()
}

function editUrl(index) {
  const urlItems = document.querySelectorAll(".url-item")
  const urlItem = urlItems[index]
  if (!urlItem) return

  urlItem.classList.add("editable")
  const input = urlItem.querySelector(".url-input")
  input.value = currentUrls[index]
  input.focus()
  input.select()
}

function saveUrlEdit(index) {
  const urlItems = document.querySelectorAll(".url-item")
  const urlItem = urlItems[index]
  if (!urlItem) return

  const input = urlItem.querySelector(".url-input")
  const newUrl = input.value.trim()

  if (!newUrl || !isValidUrl(newUrl)) {
    input.classList.add("shake")
    setTimeout(() => input.classList.remove("shake"), 500)
    return
  }

  currentUrls[index] = newUrl
  urlItem.classList.remove("editable")
  renderUrlList()
}

function cancelUrlEdit(index) {
  const urlItems = document.querySelectorAll(".url-item")
  const urlItem = urlItems[index]
  if (!urlItem) return

  urlItem.classList.remove("editable")
}

function renderUrlList() {
  urlList.innerHTML = ""
  currentUrls.forEach((url, index) => {
    const urlItem = document.createElement("div")
    urlItem.className = "url-item slide-in"
    urlItem.innerHTML = `
      <span class="url-text">${url}</span>
      <input type="text" class="url-input" value="${url}">
      <div class="url-actions">
        <button class="url-btn edit-url-btn" data-index="${index}" title="Modifier">
          <i class='bx bx-edit'></i>
        </button>
        <button class="url-btn save-url-btn" data-index="${index}" title="Sauvegarder" style="display: none;">
          <i class='bx bx-check'></i>
        </button>
        <button class="url-btn cancel-url-btn" data-index="${index}" title="Annuler" style="display: none;">
          <i class='bx bx-x'></i>
        </button>
        <button class="url-btn remove-url-btn" data-index="${index}" title="Supprimer">
          <i class='bx bx-trash'></i>
        </button>
      </div>
    `

    const editBtn = urlItem.querySelector(".edit-url-btn")
    const saveBtn = urlItem.querySelector(".save-url-btn")
    const cancelBtn = urlItem.querySelector(".cancel-url-btn")
    const removeBtn = urlItem.querySelector(".remove-url-btn")
    const input = urlItem.querySelector(".url-input")

    editBtn.addEventListener("click", () => {
      editUrl(index)
      editBtn.style.display = "none"
      saveBtn.style.display = "flex"
      cancelBtn.style.display = "flex"
    })

    saveBtn.addEventListener("click", () => {
      saveUrlEdit(index)
    })

    cancelBtn.addEventListener("click", () => {
      cancelUrlEdit(index)
      editBtn.style.display = "flex"
      saveBtn.style.display = "none"
      cancelBtn.style.display = "none"
    })

    removeBtn.addEventListener("click", () => removeUrl(index))

    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        saveUrlEdit(index)
      } else if (e.key === "Escape") {
        cancelUrlEdit(index)
        editBtn.style.display = "flex"
        saveBtn.style.display = "none"
        cancelBtn.style.display = "none"
      }
    })

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
    delete groups[editingGroup]
    
    if (groupTabs[editingGroup]) {
      groupTabs[name] = groupTabs[editingGroup]
      delete groupTabs[editingGroup]
    }
  }

  groups[name] = {
    urls: currentUrls.slice(),
    color: currentGroupColor,
  }
  chrome.storage.local.set({ groups })

  resetForm()
  renderGroups()

  saveBtn.classList.add("bounce")
  setTimeout(() => saveBtn.classList.remove("bounce"), 600)
}

function resetForm() {
  groupInput.value = ""
  currentUrls = []
  editingGroup = null
  currentGroupColor = "#667eea"
  groupColorInput.value = currentGroupColor
  renderUrlList()
  updateSaveButton()
  updateColorPresets()

  createSection.classList.remove("edit-mode")
  sectionTitle.innerHTML = '<i class="bx bx-folder-plus"></i> Créer un groupe'
  saveBtnText.textContent = "Sauvegarder le groupe"
  cancelEditBtn.style.display = "none"
}

function cancelEdit() {
  resetForm()
}

function editGroup(name) {
  const group = groups[name]
  if (!group) return

  editingGroup = name
  groupInput.value = name
  currentUrls = (group.urls || group).slice()
  currentGroupColor = group.color || "#667eea"
  groupColorInput.value = currentGroupColor

  renderUrlList()
  updateSaveButton()
  updateColorPresets()

  createSection.classList.add("edit-mode")
  sectionTitle.innerHTML = '<i class="bx bx-edit"></i> Modifier le groupe'
  saveBtnText.textContent = "Mettre à jour le groupe"
  cancelEditBtn.style.display = "flex"

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
    const group = groups[name]
    const urls = group.urls || group
    const color = group.color || "#667eea"
    const rgbValues = hexToRgbValues(color)
    const isGroupOpen = groupTabs[name] && groupTabs[name].length > 0

    const groupCard = document.createElement("div")
    groupCard.className = "group-card slide-in"
    groupCard.draggable = true
    groupCard.dataset.groupName = name
    groupCard.dataset.index = index
    groupCard.style.setProperty("--group-color", color)
    groupCard.style.setProperty("--group-color-rgb", `${rgbValues.r}, ${rgbValues.g}, ${rgbValues.b}`)

    groupCard.innerHTML = `
      <div class="group-header">
        <div class="group-name">
          <span class="drag-handle">
            <i class='bx bx-grip-vertical'></i>
          </span>
          <span class="name-text">${name}</span>
          <span class="url-count">${urls.length} site${urls.length > 1 ? "s" : ""}</span>
          ${isGroupOpen ? '<span class="status-indicator active" title="Groupe ouvert"><i class="bx bx-radio-circle-marked"></i></span>' : ""}
        </div>
        <div class="group-actions">
          <button class="group-btn edit-btn" data-action="edit" data-group="${name}" title="Modifier le groupe">
            <i class='bx bx-edit'></i>
          </button>
          <button class="group-btn launch-btn" data-action="launch" data-group="${name}" title="Lancer le groupe">
            <i class='bx bx-play'></i>
          </button>
          ${
            isGroupOpen
              ? `
            <button class="group-btn close-btn" data-action="close" data-group="${name}" title="Fermer les onglets">
              <i class='bx bx-x-circle'></i>
            </button>
          `
              : ""
          }
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

    
    const editBtn = groupCard.querySelector('[data-action="edit"]')
    const launchBtn = groupCard.querySelector('[data-action="launch"]')
    const closeBtn = groupCard.querySelector('[data-action="close"]')
    const deleteBtn = groupCard.querySelector('[data-action="delete"]')

    editBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      editGroup(name)
    })

    launchBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      launchGroup(name, e.target)
    })

    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        closeGroup(name, e.target)
      })
    }

    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      deleteGroup(name)
    })

    
    groupCard.addEventListener("dragstart", handleDragStart)
    groupCard.addEventListener("dragover", handleDragOver)
    groupCard.addEventListener("drop", handleDrop)
    groupCard.addEventListener("dragend", handleDragEnd)

    groupList.appendChild(groupCard)
  })
}


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
    const groupNames = Object.keys(groups)
    const draggedIndex = Number.parseInt(draggedElement.dataset.index)
    const targetIndex = Number.parseInt(this.dataset.index)
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
  document.querySelectorAll(".group-card").forEach((card) => {
    card.classList.remove("drag-over")
  })
  draggedElement = null
}


async function launchGroup(name, buttonElement) {
  const group = groups[name]
  if (!group) return

  const urls = group.urls || group
  const tabIds = []

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]

    try {
      const tab = await chrome.tabs.create({
        url: addProtocolIfMissing(url),
        active: i === 0, 
      })
      tabIds.push(tab.id)

      if (i < urls.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    } catch (error) {
      console.error(`Error opening tab for ${url}:`, error)
    }
  }

  
  groupTabs[name] = tabIds


  renderGroups()

  if (buttonElement) {
    animate(buttonElement, { scale: 0.8 }, { scale: 1 }, 200)
  }
}

async function closeGroup(name, buttonElement) {
  if (!groupTabs[name] || groupTabs[name].length === 0) return

  const tabIds = groupTabs[name]

  try {
    
    await chrome.tabs.remove(tabIds)

   
    groupTabs[name] = []

   
    renderGroups()

    
    if (buttonElement) {
      animate(buttonElement, { scale: 0.8 }, { scale: 1 }, 200)
    }
  } catch (error) {
    console.error(`Error closing tabs for group ${name}:`, error)
    
    groupTabs[name] = []
    renderGroups()
  }
}

function deleteGroup(name) {
  if (confirm(`Êtes-vous sûr de vouloir supprimer le groupe "${name}" ?`)) {
    
    if (groupTabs[name] && groupTabs[name].length > 0) {
      closeGroup(name)
    }

    delete groups[name]
    delete groupTabs[name]
    chrome.storage.local.set({ groups })

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
        const migratedData = {}
        for (const [name, value] of Object.entries(data)) {
          if (Array.isArray(value)) {
            migratedData[name] = { urls: value, color: "#667eea" }
          } else {
            migratedData[name] = value
          }
        }

        groups = { ...groups, ...migratedData }
        chrome.storage.local.set({ groups })
        renderGroups()

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
    "WebCluster v1.0\n\nCréez des groupes de sites web et lancez-les tous en un clic !\n\n• Ajoutez des URLs à un groupe\n• Modifiez vos groupes et leurs URLs\n• Personnalisez les couleurs\n• Réorganisez par glisser-déposer\n• Lancez tous les sites d'un groupe (cascade 1s)\n• Fermez tous les onglets d'un groupe\n• Exportez/Importez vos configurations",
  )
}


chrome.tabs.onRemoved.addListener((tabId) => {
  for (const groupName in groupTabs) {
    const index = groupTabs[groupName].indexOf(tabId)
    if (index > -1) {
      groupTabs[groupName].splice(index, 1)
      
      if (groupTabs[groupName].length === 0) {
        renderGroups()
      }
    }
  }
})


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

groupInput.addEventListener("input", updateSaveButton)


chrome.storage.local.get("groups", (data) => {
  groups = data.groups || {}

  
  const migratedGroups = {}
  for (const [name, value] of Object.entries(groups)) {
    if (Array.isArray(value)) {
      migratedGroups[name] = { urls: value, color: "#667eea" }
    } else {
      migratedGroups[name] = value
    }
  }

  groups = migratedGroups
  chrome.storage.local.set({ groups })
  renderGroups()
})

document.addEventListener("DOMContentLoaded", () => {
  initializeColorPresets()
  updateSaveButton()
})

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initializeColorPresets()
    updateSaveButton()
  })
} else {
  initializeColorPresets()
  updateSaveButton()
}

document.getElementById("infoBtn").addEventListener("click", () => {
  chrome.tabs.create({ url: "https://x.com/iam_anelka" });
});
