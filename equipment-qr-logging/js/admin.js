let equipment = []
let qrInstances = []

function setError(msg) {
  const el = document.getElementById('errorMsg')
  if (msg) {
    el.textContent = msg
    el.classList.add('visible')
  } else {
    el.classList.remove('visible')
    el.textContent = ''
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginBtn').addEventListener('click', handleLogin)
  document.getElementById('password').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin()
  })
  document.getElementById('showAddBtn').addEventListener('click', () => {
    document.getElementById('addForm').classList.remove('hidden')
    lucide.createIcons()
    document.getElementById('eqName').focus()
  })
  document.getElementById('cancelAddBtn').addEventListener('click', resetAddForm)
  document.getElementById('saveEqBtn').addEventListener('click', handleAddEquipment)
  document.getElementById('showQrBtn').addEventListener('click', toggleQrSection)
  document.getElementById('printQrBtn').addEventListener('click', () => window.print())
})

function handleLogin() {
  const pw = document.getElementById('password').value.trim()
  setError(null)

  if (pw === CONFIG.ADMIN_PASSWORD) {
    document.getElementById('loginSection').classList.remove('active')
    document.getElementById('adminSection').classList.add('active')
    loadEquipment()
  } else {
    setError('Incorrect password.')
    document.getElementById('password').value = ''
    document.getElementById('password').focus()
  }
}

async function loadEquipment() {
  const container = document.getElementById('equipmentContainer')
  container.innerHTML = '<div class="loading"><div class="spinner"></div><span>Loading equipment...</span></div>'

  try {
    const result = await getEquipment()
    if (result.equipment && result.equipment.length) {
      equipment = result.equipment
      renderEquipment()
    } else {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i data-lucide="package"></i></div><p>No equipment yet. Add your first item.</p></div>'
      lucide.createIcons()
    }
  } catch (e) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i data-lucide="alert-triangle"></i></div><p>Failed to load. Check your API URL in config.js</p></div>'
    lucide.createIcons()
  }
}

function renderEquipment() {
  const container = document.getElementById('equipmentContainer')
  container.innerHTML = equipment.map(eq => {
    const typeInfo = eq.type ? `<span class="meta" style="margin-right:var(--space-2)">${escapeHtml(eq.type)}</span>` : ''
    const stockInfo = eq.stock !== undefined ? `<span class="meta">Stock: ${eq.stock}</span>` : ''
    return `
    <div class="equipment-card">
      <div class="equipment-card-main">
        <div class="equipment-card-body">
          <h3>${escapeHtml(eq.item_name)}</h3>
          <p class="desc">${eq.description ? escapeHtml(eq.description) : 'No description'}</p>
          <div>${typeInfo}${stockInfo}</div>
          <span class="meta">${escapeHtml(eq.item_id)}</span>
        </div>
        <span class="badge ${eq.status === 'available' ? 'badge-available' : 'badge-borrowed'}">${eq.status}</span>
      </div>
      <div class="equipment-card-actions" style="padding:0 var(--space-4) var(--space-3)">
        <button class="btn btn-outline btn-sm no-print" onclick="showQrFor('${eq.item_id}')"><i data-lucide="qr-code"></i> QR</button>
        <button class="btn btn-danger btn-sm no-print" onclick="handleDelete('${eq.item_id}')"><i data-lucide="trash-2"></i> Delete</button>
      </div>
      <div id="qr-${eq.item_id}" class="hidden" style="padding:0 var(--space-4) var(--space-4)"></div>
    </div>`
  }).join('')
  lucide.createIcons()
}

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

function resetAddForm() {
  document.getElementById('addForm').classList.add('hidden')
  document.getElementById('eqName').value = ''
  document.getElementById('eqType').value = ''
  document.getElementById('eqDesc').value = ''
  document.getElementById('eqStock').value = ''
  setError(null)
}

async function handleAddEquipment() {
  const name = document.getElementById('eqName').value.trim()
  if (!name) {
    setError('Please enter an equipment name.')
    document.getElementById('eqName').focus()
    return
  }

  const type = document.getElementById('eqType').value.trim()
  const desc = document.getElementById('eqDesc').value.trim()
  const stock = parseInt(document.getElementById('eqStock').value) || 0
  const btn = document.getElementById('saveEqBtn')
  btn.innerHTML = '<i data-lucide="loader-circle" class="lucide-spin"></i> Saving...'
  btn.disabled = true
  lucide.createIcons()
  setError(null)

  try {
    const result = await addEquipment(name, type, desc, stock)
    if (result.success) {
      resetAddForm()
      await loadEquipment()
    } else {
      setError(result.error || 'Failed to save equipment.')
    }
  } catch (e) {
    setError('Network error. Check your connection.')
  }

  btn.innerHTML = '<i data-lucide="check"></i> Save'
  btn.disabled = false
  lucide.createIcons()
}

async function handleDelete(item_id) {
  if (!confirm('Delete this equipment? This action cannot be undone.')) return
  setError(null)

  try {
    const result = await deleteEquipment(item_id)
    if (result.success) {
      await loadEquipment()
    } else {
      setError(result.error || 'Failed to delete.')
    }
  } catch (e) {
    setError('Network error.')
  }
}

function showQrFor(item_id) {
  const container = document.getElementById(`qr-${item_id}`)
  if (!container.classList.contains('hidden')) {
    container.classList.add('hidden')
    container.innerHTML = ''
    return
  }

  container.classList.remove('hidden')
  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>'

  setTimeout(() => {
    container.innerHTML = ''
    new QRCode(container, { text: item_id, width: 140, height: 140 })
  }, 50)
}

function toggleQrSection() {
  const section = document.getElementById('qrSection')
  const grid = document.getElementById('qrGrid')

  if (!section.classList.contains('hidden')) {
    section.classList.add('hidden')
    return
  }

  section.classList.remove('hidden')
  grid.innerHTML = ''
  qrInstances = []

  equipment.forEach(eq => {
    const div = document.createElement('div')
    div.className = 'qr-item'

    const qrDiv = document.createElement('div')
    const label = document.createElement('label')
    label.textContent = `${eq.item_name} (${eq.item_id})`

    div.appendChild(qrDiv)
    div.appendChild(label)
    grid.appendChild(div)

    qrInstances.push(new QRCode(qrDiv, { text: eq.item_id, width: 128, height: 128 }))
  })
}
