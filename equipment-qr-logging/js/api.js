let mockStore = {
  equipment: JSON.parse(JSON.stringify(MOCK_EQUIPMENT)),
  logs: [],
}

async function api(method, payload) {
  if (CONFIG.USE_MOCK) return mockApi(method, payload)

  if (method === 'GET') {
    const params = new URLSearchParams(payload).toString()
    const res = await fetch(`${CONFIG.API_URL}?${params}`)
    return res.json()
  }

  const res = await fetch(CONFIG.API_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return res.json()
}

async function getEquipment() {
  return api('GET', { action: 'getEquipment' })
}

async function submitBorrow(name, items, time) {
  return api('POST', {
    action: 'borrow', name,
    items: items.map(i => ({ item_id: i.item_id, item_name: i.item_name })), time,
  })
}

async function submitReturn(name, items, time) {
  return api('POST', {
    action: 'return', name,
    items: items.map(i => ({ item_id: i.item_id, item_name: i.item_name })), time,
  })
}

async function addEquipment(item_name, type, description, stock) {
  return api('POST', { action: 'addEquipment', item_name, type, description, stock })
}

async function deleteEquipment(item_id) {
  return api('POST', { action: 'deleteEquipment', item_id })
}

function mockApi(method, payload) {
  const action = payload.action || payload.get?.('action')

  if (action === 'getEquipment') {
    return { equipment: mockStore.equipment }
  }

  if (action === 'borrow') {
    payload.items.forEach(item => {
      mockStore.logs.push({
        log_id: crypto.randomUUID(),
        borrower: payload.name,
        item_id: item.item_id,
        item_name: item.item_name,
        borrow_time: payload.time,
        return_time: '',
      })
      const eq = mockStore.equipment.find(e => e.item_id === item.item_id)
      if (eq) eq.status = 'borrowed'
    })
    return { success: true }
  }

  if (action === 'return') {
    payload.items.forEach(item => {
      const log = mockStore.logs.filter(l => l.item_id === item.item_id && l.return_time === '')
      if (log.length) log[log.length - 1].return_time = payload.time
      const eq = mockStore.equipment.find(e => e.item_id === item.item_id)
      if (eq) eq.status = 'available'
    })
    return { success: true }
  }

  if (action === 'addEquipment') {
    const count = mockStore.equipment.length + 1
    const item_id = 'EQ-' + String(count).padStart(3, '0')
    mockStore.equipment.push({ item_id, item_name: payload.item_name, type: payload.type || '', description: payload.description || '', stock: payload.stock || 0, status: 'available' })
    return { success: true, item_id }
  }

  if (action === 'deleteEquipment') {
    mockStore.equipment = mockStore.equipment.filter(e => e.item_id !== payload.item_id)
    return { success: true }
  }

  return { error: 'Unknown action' }
}
