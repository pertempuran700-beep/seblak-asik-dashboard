/**
 * lib/api.js — API client ke Google Apps Script (via /api/proxy untuk
 * menyembunyikan Web App URL dari client & menghindari isu CORS).
 */

async function callApi(action, params = {}) {
  const idToken = typeof window !== 'undefined' ? localStorage.getItem('seblak_id_token') : null;

  const res = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, idToken, ...params }),
  });

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Terjadi kesalahan pada server');
  }
  return json.data;
}

export const api = {
  login: (idToken) => callApi('login', { idToken }),
  
  // Fitur Baru: Notifikasi & Import Excel
  getNotifications: () => callApi('getNotifications'),
  importSalesExcel: (transactions) => callApi('importSalesExcel', { transactions }),

  // Sales
  createSale: (items, paymentMethod, promoCode, customerName) =>
    callApi('createSale', { items, paymentMethod, promoCode, customerName }),
  getSales: (filters) => callApi('getSales', { filters }),
  getDailySummary: () => callApi('getDailySummary'),
  getMonthlySummary: (month, year) => callApi('getMonthlySummary', { month, year }),

  // Products
  listProducts: () => callApi('listProducts'),
  createProduct: (product) => callApi('createProduct', { product }),
  updateProduct: (productId, updates) => callApi('updateProduct', { productId, updates }),

  // Stock
  addStockIn: (productId, vendorId, qtyBeli, hargaBeli, paymentStatus, dueDate, invoiceNo) =>
    callApi('addStockIn', { productId, vendorId, qtyBeli, hargaBeli, paymentStatus, dueDate, invoiceNo }),
  addStockOut: (productId, quantity, reason, referenceId) =>
    callApi('addStockOut', { productId, quantity, reason, referenceId }),
  getStockLevels: () => callApi('getStockLevels'),
  getStockMovement: (productId, dateRange) => callApi('getStockMovement', { productId, dateRange }),

  // Finance
  generateIncomeStatement: (month, year) => callApi('generateIncomeStatement', { month, year }),
  getFinancialMetrics: (period) => callApi('getFinancialMetrics', { period }),
  getAPAR: () => callApi('getAPAR'),
  recordPayment: (recordId, amount) => callApi('recordPayment', { recordId, amount }),
  createExpense: (category, description, amount, paymentMethod, receiptUrl) =>
    callApi('createExpense', { category, description, amount, paymentMethod, receiptUrl }),
  listExpenses: (filters) => callApi('listExpenses', { filters }),

  // Shareholder
  generateShareholderReport: (month, year) => callApi('generateShareholderReport', { month, year }),
  getShareholderHistory: (shareholderId) => callApi('getShareholderHistory', { shareholderId }),
  getInfaqHistory: () => callApi('getInfaqHistory'),

  // Promo
  createPromo: (name, code, type, value, startDate, endDate, minPurchase) =>
    callApi('createPromo', { name, code, type, value, startDate, endDate, minPurchase }),
  getActivePromos: () => callApi('getActivePromos'),
  getPromoAnalytics: () => callApi('getPromoAnalytics'),

  // Employee
  listEmployees: () => callApi('listEmployees'),
  createEmployee: (employee) => callApi('createEmployee', { employee }),
  updateEmployee: (employeeId, updates) => callApi('updateEmployee', { employeeId, updates }),
  getSchedule: (employeeId, month) => callApi('getSchedule', { employeeId, month }),
  createSchedule: (employeeId, dates, status) => callApi('createSchedule', { employeeId, dates, status }),

  // Attendance & Performance (Baru)
  clockIn: (employeeId, lat, lng, reason) => callApi('clockIn', { employeeId, lat, lng, reason }),
  clockOut: (employeeId, lat, lng) => callApi('clockOut', { employeeId, lat, lng }),
  approveAttendance: (attendanceId, approved, notes) => callApi('approveAttendance', { attendanceId, approved, notes }),
  getAttendanceSummary: (employeeId, month) => callApi('getAttendanceSummary', { employeeId, month }),
  getPerformanceSummary: (month) => callApi('getPerformanceSummary', { month }),
  requestLeave: (employeeId, date, reason, substituteId, compensationType) => callApi('requestLeave', { employeeId, date, reason, substituteId, compensationType }),

  // Payroll
  createBonusConfig: (bonusName, type, conditionDesc, conditionValue, amount, period) =>
    callApi('createBonusConfig', { bonusName, type, conditionDesc, conditionValue, amount, period }),
  listBonusConfigs: () => callApi('listBonusConfigs'),
  generatePayroll: (month, year) => callApi('generatePayroll', { month, year }),
  getPayslip: (employeeId, month) => callApi('getPayslip', { employeeId, month }),
  markAsPaid: (payrollId) => callApi('markAsPaid', { payrollId }),

  // Vendors
  listVendors: () => callApi('listVendors'),
  createVendor: (vendor) => callApi('createVendor', { vendor }),
  updateVendor: (vendorId, updates) => callApi('updateVendor', { vendorId, updates }),
};
