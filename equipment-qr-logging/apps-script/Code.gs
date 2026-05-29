const MASTER_SHEET = 'Equipment'
const SHEET_EQUIPMENT = 'Equipment'
const SHEET_LOG = 'BorrowLog'
const SPREADSHEET_ID = '14AUw-o53cyXoCRLmrdkaikMVlQzYyWo-Ad2g6BzHfdA'

// Equipment columns: 0=item_id, 1=item_name, 2=type, 3=description, 4=stock, 5=status
const COL_EQ_ID = 0, COL_EQ_NAME = 1, COL_EQ_TYPE = 2, COL_EQ_DESC = 3, COL_EQ_STOCK = 4, COL_EQ_STATUS = 5
// BorrowLog columns: 0=log_id, 1=borrower, 2=item_id, 3=item_name, 4=borrow_time, 5=return_time
const COL_LOG_BORROWER = 1, COL_LOG_ITEM_ID = 2, COL_LOG_ITEM_NAME = 3, COL_LOG_BORROW_TIME = 4, COL_LOG_RETURN_TIME = 5

function doGet(e) {
  const action = e.parameter.action
  if (action === 'getEquipment') return getEquipment()
  return jsonResponse({ error: 'Unknown action' }, 400)
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents)
    const action = data.action
    switch (action) {
      case 'borrow': return borrow(data)
      case 'return': return doReturn(data)
      case 'addEquipment': return addEquipment(data)
      case 'deleteEquipment': return deleteEquipment(data)
      default: return jsonResponse({ error: 'Unknown action' }, 400)
    }
  } catch (err) {
    return jsonResponse({ error: err.message }, 500)
  }
}

function getEquipment() {
  const ss = getSpreadsheet()
  const sheet = ensureEquipmentSheet(ss)
  if (!sheet) return jsonResponse({ equipment: [] })

  const rows = sheet.getDataRange().getValues()
  if (rows.length < 2) return jsonResponse({ equipment: [] })

  const equipment = rows.slice(1).map(r => ({
    item_id: r[COL_EQ_ID],
    item_name: r[COL_EQ_NAME],
    type: r[COL_EQ_TYPE] || '',
    description: r[COL_EQ_DESC] || '',
    stock: r[COL_EQ_STOCK] || 0,
    status: r[COL_EQ_STATUS] || 'available',
  }))

  return jsonResponse({ equipment })
}

function borrow(data) {
  const ss = getSpreadsheet()
  const sheet = ensureBorrowLogSheet(ss)
  const equipSheet = ensureEquipmentSheet(ss)

  const name = data.name
  const items = data.items || []
  const time = data.time || new Date().toISOString()
  const results = []

  items.forEach(item => {
    sheet.appendRow([
      Utilities.getUuid(),
      name,
      item.item_id,
      item.item_name,
      time,
      '',
    ])
    results.push({ item_id: item.item_id, status: 'borrowed' })
    markEquipmentStatus(equipSheet, item.item_id, 'borrowed')
  })

  return jsonResponse({ success: true, results })
}

function doReturn(data) {
  const ss = getSpreadsheet()
  const logSheet = ensureBorrowLogSheet(ss)
  const equipSheet = ensureEquipmentSheet(ss)

  const items = data.items || []
  const time = data.time || new Date().toISOString()
  const results = []

  items.forEach(item => {
    const logData = logSheet.getDataRange().getValues()
    for (let i = logData.length - 1; i >= 1; i--) {
      if (logData[i][COL_LOG_ITEM_ID] === item.item_id && logData[i][COL_LOG_RETURN_TIME] === '') {
        logSheet.getRange(i + 1, COL_LOG_RETURN_TIME + 1).setValue(time)
        break
      }
    }
    results.push({ item_id: item.item_id, status: 'returned' })
    markEquipmentStatus(equipSheet, item.item_id, 'available')
  })

  return jsonResponse({ success: true, results })
}

function addEquipment(data) {
  const ss = getSpreadsheet()
  const sheet = ensureEquipmentSheet(ss)
  const id = data.item_id || generateId(sheet)

  sheet.appendRow([id, data.item_name, data.type || '', data.description || '', data.stock || 0, 'available'])

  return jsonResponse({ success: true, item_id: id })
}

function deleteEquipment(data) {
  const ss = getSpreadsheet()
  const sheet = ensureEquipmentSheet(ss)
  const rows = sheet.getDataRange().getValues()

  for (let i = rows.length - 1; i >= 1; i--) {
    if (rows[i][COL_EQ_ID] === data.item_id) {
      sheet.deleteRow(i + 1)
      return jsonResponse({ success: true })
    }
  }

  return jsonResponse({ error: 'Equipment not found' }, 404)
}

function markEquipmentStatus(sheet, item_id, status) {
  if (!sheet) return
  const rows = sheet.getDataRange().getValues()
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][COL_EQ_ID] === item_id) {
      sheet.getRange(i + 1, COL_EQ_STATUS + 1).setValue(status)
      return
    }
  }
}

function generateId() {
  return generateIdForSheet(ensureEquipmentSheet(getSpreadsheet()))
}

function jsonResponse(data, status) {
  const output = ContentService.createTextOutput(JSON.stringify(data))
  output.setMimeType(ContentService.MimeType.JSON)
  return output
}

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID)
}

function ensureEquipmentSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_EQUIPMENT)
  if (sheet && isProcessedEquipmentSheet(sheet)) return sheet

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_EQUIPMENT)
  }

  const imported = importMasterList(ss, sheet)
  if (imported) return sheet

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['item_id', 'item_name', 'type', 'description', 'stock', 'status'])
  }

  return sheet
}

function ensureBorrowLogSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_LOG)
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_LOG)
    sheet.appendRow(['log_id', 'borrower', 'item_id', 'item_name', 'borrow_time', 'return_time'])
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(['log_id', 'borrower', 'item_id', 'item_name', 'borrow_time', 'return_time'])
  }
  return sheet
}

function importMasterList(ss, targetSheet) {
  const master = ss.getSheetByName(MASTER_SHEET)
  if (!master) return false

  const values = master.getDataRange().getDisplayValues()
  if (values.length < 2) return false

  const headers = values[0].map(normalizeHeader)
  const nameCol = findHeaderIndex(headers, ['equipment', 'item', 'description', 'name'])
  const quantityCol = findHeaderIndex(headers, ['quantity', 'qty', 'stock'])
  const unitCol = findHeaderIndex(headers, ['unit', 'type', 'category'])
  const linkCol = findHeaderIndex(headers, ['link', 'url'])
  const noteCol = findHeaderIndex(headers, ['note', 'notes', 'remarks'])

  const rows = []
  let currentGroup = ''
  let nextId = 1

  for (let i = 1; i < values.length; i++) {
    const row = values[i]
    const name = getCell(row, nameCol, 0)
    const quantity = getCell(row, quantityCol, 1)
    const unit = getCell(row, unitCol, 2)
    const link = getCell(row, linkCol, 3)
    const note = getCell(row, noteCol, 4)

    if (!name && !quantity && !unit && !link && !note) continue

    const numericQty = parseQuantity(quantity)
    const isGroupRow = name && !quantity && !unit && !link && !note

    if (isGroupRow) {
      currentGroup = name
      continue
    }

    if (!name || numericQty === null) continue

    const descriptionParts = []
    if (currentGroup) descriptionParts.push(currentGroup)
    if (unit) descriptionParts.push(unit)
    if (link) descriptionParts.push(link)
    if (note) descriptionParts.push(note)

    rows.push([
      'EQ-' + String(nextId++).padStart(3, '0'),
      name,
      currentGroup,
      descriptionParts.join(' | '),
      numericQty,
      'available',
    ])
  }

  if (!rows.length) return false

  targetSheet.clearContents()
  targetSheet.getRange(1, 1, 1, 6).setValues([['item_id', 'item_name', 'type', 'description', 'stock', 'status']])
  targetSheet.getRange(2, 1, rows.length, 6).setValues(rows)
  return true
}

function isProcessedEquipmentSheet(sheet) {
  const lastRow = sheet.getLastRow()
  const lastColumn = sheet.getLastColumn()
  if (lastRow < 1 || lastColumn < 6) return false

  const headers = sheet.getRange(1, 1, 1, Math.min(lastColumn, 6)).getDisplayValues()[0].map(normalizeHeader)
  return headers[COL_EQ_ID] === 'item_id' && headers[COL_EQ_NAME] === 'item_name'
}

function parseQuantity(quantity) {
  if (!quantity) return null
  const match = String(quantity).match(/(\d+(?:\.\d+)?)/)
  if (!match) return null
  const value = Number(match[1])
  return Number.isFinite(value) ? value : null
}

function normalizeHeader(value) {
  return String(value || '').trim().toLowerCase()
}

function findHeaderIndex(headers, candidates) {
  for (const candidate of candidates) {
    const idx = headers.indexOf(candidate)
    if (idx !== -1) return idx
  }
  return -1
}

function getCell(row, preferredIndex, fallbackIndex) {
  const index = preferredIndex !== -1 ? preferredIndex : fallbackIndex
  return String(row[index] || '').trim()
}

function generateIdForSheet(sheet) {
  const rows = sheet.getDataRange().getValues()
  let maxId = 0

  for (let i = 1; i < rows.length; i++) {
    const value = String(rows[i][COL_EQ_ID] || '')
    const match = value.match(/^EQ-(\d+)$/)
    if (!match) continue
    maxId = Math.max(maxId, Number(match[1]))
  }

  return 'EQ-' + String(maxId + 1).padStart(3, '0')
}
