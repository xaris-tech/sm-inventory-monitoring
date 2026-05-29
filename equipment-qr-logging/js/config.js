const APP_NAME = 'SM Equipment Monitoring'

const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbw-IvBEPs1FVpFwpuO3jZP8rE2UUumZ_ui0GkLXT986Z9rgVvM8aGpLzrMAGlwRp7Yf/exec',
  ADMIN_PASSWORD: 'admin123',
  USE_MOCK: false,
}

const MOCK_EQUIPMENT = [
  { item_id: 'EQ-001', item_name: 'Cordless Drill', type: 'Power Tool', description: '18V Makita', stock: 5, status: 'available' },
  { item_id: 'EQ-002', item_name: 'Extension Ladder', type: 'Access', description: '6ft aluminum', stock: 3, status: 'available' },
  { item_id: 'EQ-003', item_name: 'Concrete Mixer', type: 'Heavy', description: '1 bag capacity', stock: 2, status: 'available' },
  { item_id: 'EQ-004', item_name: 'Angle Grinder', type: 'Power Tool', description: '4.5" Dewalt', stock: 4, status: 'available' },
  { item_id: 'EQ-005', item_name: 'Circular Saw', type: 'Power Tool', description: '7-1/4" Skilsaw', stock: 3, status: 'available' },
  { item_id: 'EQ-006', item_name: 'Air Compressor', type: 'Heavy', description: '6 gallon 150 PSI', stock: 2, status: 'available' },
  { item_id: 'EQ-007', item_name: 'Pressure Washer', type: 'Cleaning', description: '2000 PSI electric', stock: 3, status: 'available' },
  { item_id: 'EQ-008', item_name: 'Electric Hoist', type: 'Rigging', description: '1 ton capacity', stock: 1, status: 'available' },
  { item_id: 'EQ-009', item_name: 'Welding Machine', type: 'Welding', description: '200A MIG/TIG', stock: 2, status: 'available' },
  { item_id: 'EQ-010', item_name: 'Jackhammer', type: 'Heavy', description: '35lb electric', stock: 2, status: 'available' },
]
