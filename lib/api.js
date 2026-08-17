/**
 * lib/api.js — Jalur Resmi Vercel Proxy
 * (Sekarang aman dari Timeout karena Code.gs sudah Hyper-Speed!)
 */

async function callApi(action, params = {}) {
  const idToken = typeof window !== 'undefined' ? localStorage.getItem('seblak_id_token') : null;

  // Kembali menelepon Proxy milik Vercel (Aman dari blokir CORS Browser)
  const res = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, idToken, ...params }),
  });

  const text = await res.text();
  let json;
  
  try {
    json = JSON.parse(text);
  } catch (err) {
    throw new Error(`Koneksi Server Terputus (Error ${res.status}). Tunggu sebentar dan coba lagi.`);
  }

  if (!json.success) {
    throw new Error(json.error || 'Terjadi kesalahan pada server Google');
  }
  
  return json.data;
}

export const api = {
  getMonthlySchedule: (period) => callApi('getMonthlySchedule', { period }),
  saveDailySchedule: (payload) => callApi('saveDailySchedule', { payload }),
  deleteDailySchedule: (scheduleId) => callApi('deleteDailySchedule', { scheduleId }),
  login: (idToken) => callApi('login', { idToken }),
  getNotifications: () => callApi('getNotifications'),
  importSalesExcel: (transactions) => callApi('importSalesExcel', { transactions }),
  createSale: (items, paymentMethod, promoCode, customerName) => callApi('createSale', { items, paymentMethod, promoCode, customerName }),
  getSales: (filters) => callApi('getSales', { filters }),
  getDailySummary: () => callApi('getDailySummary'),
  getMonthlySummary: (month, year) => callApi('getMonthlySummary', { month, year }),
  getDashboardSummary: (startDate, endDate) => callApi('getDashboardSummary', { startDate, endDate }),
  listProducts: () => callApi('listProducts'),
  createProduct: (product) => callApi('createProduct', { product }),
  updateProduct: (productId, updates) => callApi('updateProduct', { productId, updates }),
  addStockIn: (productId, vendorId, qtyBeli, hargaBeli, paymentStatus, dueDate, invoiceNo) => callApi('addStockIn', { productId, vendorId, qtyBeli, hargaBeli, paymentStatus, dueDate, invoiceNo }),
  addStockOut: (productId, quantity, reason, referenceId) => callApi('addStockOut', { productId, quantity, reason, referenceId }),
  getStockLevels: () => callApi('getStockLevels'),
  getStockMovement: (productId, dateRange) => callApi('getStockMovement', { productId, dateRange }),
  generateIncomeStatement: (month, year) => callApi('generateIncomeStatement', { month, year }),
  getFinancialMetrics: (period) => callApi('getFinancialMetrics', { period }),
  getAPAR: () => callApi('getAPAR'),
  recordPayment: (recordId, amount) => callApi('recordPayment', { recordId, amount }),
  createExpense: (category, description, amount, paymentMethod, receiptUrl) => callApi('createExpense', { category, description, amount, paymentMethod, receiptUrl }),
  listExpenses: (filters) => callApi('listExpenses', { filters }),
  generateShareholderReport: (month, year) => callApi('generateShareholderReport', { month, year }),
  getShareholderHistory: (shareholderId) => callApi('getShareholderHistory', { shareholderId }),
  getInfaqHistory: () => callApi('getInfaqHistory'),
  createPromo: (name, code, type, value, startDate, endDate, minPurchase) => callApi('createPromo', { name, code, type, value, startDate, endDate, minPurchase }),
  getActivePromos: () => callApi('getActivePromos'),
  getPromoAnalytics: () => callApi('getPromoAnalytics'),
  listEmployees: () => callApi('listEmployees'),
  createEmployee: (employee) => callApi('createEmployee', { employee }),
  updateEmployee: (employeeId, updates) => callApi('updateEmployee', { employeeId, updates }),
  getSchedule: (employeeId, month) => callApi('getSchedule', { employeeId, month }),
  createSchedule: (employeeId, dates, status) => callApi('createSchedule', { employeeId, dates, status }),
  clockIn: (employeeId, lat, lng, reason) => callApi('clockIn', { employeeId, lat, lng, reason }),
  clockOut: (employeeId, lat, lng) => callApi('clockOut', { employeeId, lat, lng }),
  approveAttendance: (attendanceId, approved, notes) => callApi('approveAttendance', { attendanceId, approved, notes }),
  getAttendanceSummary: (employeeId, month) => callApi('getAttendanceSummary', { employeeId, month }),
  getPerformanceSummary: (period) => callApi('getPerformanceSummary', { period }),
  requestLeave: (employeeId, date, reason, substituteId, compensationType, swapDate) => 
    callApi('requestLeave', { employeeId, date, reason, substituteId, compensationType, swapDate }),
  getEmployeeDayOffDates: (employeeId) => callApi('getEmployeeDayOffDates', { employeeId }),
  createBonusConfig: (bonusName, type, conditionDesc, conditionValue, amount, period) => callApi('createBonusConfig', { bonusName, type, conditionDesc, conditionValue, amount, period }),
  listBonusConfigs: () => callApi('listBonusConfigs'),
  generatePayroll: (month, year) => callApi('generatePayroll', { month, year }),
  getPayslip: (employeeId, month) => callApi('getPayslip', { employeeId, month }),
  markAsPaid: (payrollId) => callApi('markAsPaid', { payrollId }),
  listVendors: () => callApi('listVendors'),
  createVendor: (vendor) => callApi('createVendor', { vendor }),
  updateVendor: (vendorId, updates) => callApi('updateVendor', { vendorId, updates }),
  approveLeave: (leaveId, approved, notes) => callApi('approveLeave', { leaveId, approved, notes }),
  submitPerformanceReview: (employeeId, period, scores) => callApi('submitPerformanceReview', { employeeId, period, scores }),
  getDailyBonusLog: (period) => callApi('getDailyBonusLog', { period }),
  getSystemSettings: () => callApi('getSystemSettings'),
  createEmployeeLoan: (employeeId, amount, tenorMonths, startMonth) => callApi('createEmployeeLoan', { employeeId, amount, tenorMonths, startMonth }),
};
