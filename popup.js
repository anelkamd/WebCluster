let groups = {}
let currentUrls = []
let editingGroup = null
let draggedElement = null
let currentGroupColor = "#667eea"

// Predefined color palette
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
const groupColorInput = document.getElementById("groupColor")
const colorPresets_container = document.getElementById("colorPresets")

// Initialize Lucide icons
function initializeLucideIcons() {
    if (typeof lucide !== "undefined") {
        lucide.createIcons()
    }
}

// Simple animation functions
function animate(element, fromProps, toProps, duration = 300) {
    const startTime = performance.now()
    const startProps = {}

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
            if (toProps.scale === 1 && toProps.x === 0) {
                element.style.transform = ""
            }
        }
    }

    requestAnimationFrame(step)
}

// Initialize color presets
function initializeColorPresets() {
    colorPresets_container.innerHTML = ""
    colorPresets.forEach((color) => {
        const preset = document.createElement("div")
        preset.className = "color-preset"
        preset.style.backgroundColor = color
        preset.addEventListener("click", () => {
            currentGroupColor = color
            groupColorInput.value = color
            updateColorPresets()
        })
        colorPresets_container.appendChild(preset)
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

// Event Listeners
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

function editUrl(index) {
    const urlItems = document.querySelectorAll(".url-item")
    const urlItem = urlItems[index]
    if (!urlItem) return

    urlItem.classList.add("editable")
    const input = urlItem.querySelector(".url-input")
    const text = urlItem.querySelector(".url-text")

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
          <i data-lucide="edit-2"></i>
        </button>
        <button class="url-btn save-url-btn" data-index="${index}" title="Sauvegarder" style="display: none;">
          <i data-lucide="check"></i>
        </button>
        <button class="url-btn cancel-url-btn" data-index="${index}" title="Annuler" style="display: none;">
          <i data-lucide="x"></i>
        </button>
        <button class="url-btn remove-url-btn" data-index="${index}" title="Supprimer">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    `

        // Add event listeners
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

    // Re-initialize Lucide icons for new elements
    initializeLucideIcons()
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

    groups[name] = {
        urls: currentUrls.slice(),
        color: currentGroupColor,
    }
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
    currentGroupColor = "#667eea"
    groupColorInput.value = currentGroupColor
    renderUrlList()
    updateSaveButton()
    updateColorPresets()

    // Reset UI to create mode
    createSection.classList.remove("edit-mode")
    sectionTitle.innerHTML = '<i data-lucide="folder-plus"></i> Créer un groupe'
    saveBtnText.textContent = "Sauvegarder le groupe"
    cancelEditBtn.style.display = "none"

    initializeLucideIcons()
}

function cancelEdit() {
    resetForm()
}

function editGroup(name) {
    const group = groups[name]
    if (!group) return

    editingGroup = name
    groupInput.value = name
    currentUrls = (group.urls || group).slice() // Support old format
    currentGroupColor = group.color || "#667eea"
    groupColorInput.value = currentGroupColor

    renderUrlList()
    updateSaveButton()
    updateColorPresets()

    // Update UI to edit mode
    createSection.classList.add("edit-mode")
    sectionTitle.innerHTML = '<i data-lucide="edit"></i> Modifier le groupe'
    saveBtnText.textContent = "Mettre à jour le groupe"
    cancelEditBtn.style.display = "flex"

    // Scroll to top
    document.querySelector(".container").scrollTop = 0
    initializeLucideIcons()
}

function renderGroups() {
    const groupNames = Object.keys(groups)

    if (groupNames.length === 0) {
        groupList.innerHTML = `
      <div class="empty-state">
        <i data-lucide="folder-open"></i>
        <h4>Aucun groupe créé</h4>
        <p>Créez votre premier groupe de sites web pour commencer</p>
      </div>
    `
        initializeLucideIcons()
        return
    }

    groupList.innerHTML = ""
    groupNames.forEach((name, index) => {
        const group = groups[name]
        const urls = group.urls || group // Support old format
        const color = group.color || "#667eea"
        const rgbValues = hexToRgbValues(color)

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
            <i data-lucide="grip-vertical"></i>
          </span>
          <span class="name-text">${name}</span>
          <span class="url-count">${urls.length} site${urls.length > 1 ? "s" : ""}</span>
        </div>
        <div class="group-actions">
          <button class="group-btn edit-btn" data-action="edit" data-group="${name}" title="Modifier le groupe">
            <i data-lucide="edit"></i>
          </button>
          <button class="group-btn launch-btn" data-action="launch" data-group="${name}" title="Lancer le groupe">
            <i data-lucide="play"></i>
          </button>
          <button class="group-btn delete-btn" data-action="delete" data-group="${name}" title="Supprimer le groupe">
            <i data-lucide="trash-2"></i>
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

    initializeLucideIcons()
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
    const group = groups[name]
    if (!group) return

    const urls = group.urls || group // Support old format
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
                // Migrate old format to new format
                const migratedData = {}
                for (const [name, value] of Object.entries(data)) {
                    if (Array.isArray(value)) {
                        // Old format: just array of URLs
                        migratedData[name] = {
                            urls: value,
                            color: "#667eea",
                        }
                    } else {
                        // New format: object with urls and color
                        migratedData[name] = value
                    }
                }

                groups = { ...groups, ...migratedData }
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
        "WebCluster v1.0\n\nCréez des groupes de sites web et lancez-les tous en un clic !\n\n• Ajoutez des URLs à un groupe\n• Modifiez vos groupes et leurs URLs\n• Personnalisez les couleurs\n• Réorganisez par glisser-déposer\n• Lancez tous les sites d'un groupe\n• Exportez/Importez vos configurations",
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

    // Migrate old format to new format
    const migratedGroups = {}
    for (const [name, value] of Object.entries(groups)) {
        if (Array.isArray(value)) {
            // Old format: just array of URLs
            migratedGroups[name] = {
                urls: value,
                color: "#667eea",
            }
        } else {
            // New format: object with urls and color
            migratedGroups[name] = value
        }
    }

    groups = migratedGroups
    chrome.storage.local.set({ groups })
    renderGroups()
})

// Initialize UI
document.addEventListener("DOMContentLoaded", () => {
    initializeColorPresets()
    updateSaveButton()
    initializeLucideIcons()
})

// Initialize immediately if DOM is already loaded
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        initializeColorPresets()
        updateSaveButton()
        initializeLucideIcons()
    })
} else {
    initializeColorPresets()
    updateSaveButton()
    initializeLucideIcons()
}
