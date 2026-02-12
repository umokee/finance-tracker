import client from './client'

// Categories
export const getCategories = () => client.get('/categories').then(r => r.data)
export const createCategory = (data) => client.post('/categories', data).then(r => r.data)
export const updateCategory = (id, data) => client.patch(`/categories/${id}`, data).then(r => r.data)
export const deleteCategory = (id) => client.delete(`/categories/${id}`)

// Transactions
export const getTransactions = (params) => client.get('/transactions', { params }).then(r => r.data)
export const getTransactionSummary = (params) => client.get('/transactions/summary', { params }).then(r => r.data)
export const createTransaction = (data) => client.post('/transactions', data).then(r => r.data)
export const updateTransaction = (id, data) => client.patch(`/transactions/${id}`, data).then(r => r.data)
export const deleteTransaction = (id) => client.delete(`/transactions/${id}`)

// Goals
export const getGoals = () => client.get('/goals').then(r => r.data)
export const createGoal = (data) => client.post('/goals', data).then(r => r.data)
export const updateGoal = (id, data) => client.patch(`/goals/${id}`, data).then(r => r.data)
export const deleteGoal = (id) => client.delete(`/goals/${id}`)
export const contributeToGoal = (id, data) => client.post(`/goals/${id}/contribute`, data).then(r => r.data)
export const getGoalHistory = (id) => client.get(`/goals/${id}/history`).then(r => r.data)

// Budgets
export const getBudgets = (params) => client.get('/budgets', { params }).then(r => r.data)
export const createBudget = (data) => client.post('/budgets', data).then(r => r.data)
export const updateBudget = (id, data) => client.patch(`/budgets/${id}`, data).then(r => r.data)
export const deleteBudget = (id) => client.delete(`/budgets/${id}`)

// Recurring transactions
export const getRecurringTransactions = () => client.get('/recurring').then(r => r.data)
export const createRecurringTransaction = (data) => client.post('/recurring', data).then(r => r.data)
export const updateRecurringTransaction = (id, data) => client.patch(`/recurring/${id}`, data).then(r => r.data)
export const deleteRecurringTransaction = (id) => client.delete(`/recurring/${id}`)
export const processRecurringTransactions = () => client.post('/recurring/process').then(r => r.data)

// Analytics
export const getOverview = (params) => client.get('/analytics/overview', { params }).then(r => r.data)
export const getSpendingByCategory = (params) => client.get('/analytics/by-category', { params }).then(r => r.data)
export const getTrend = (params) => client.get('/analytics/trend', { params }).then(r => r.data)
export const getDailySpending = (params) => client.get('/analytics/daily-spending', { params }).then(r => r.data)

// Settings
export const getSettings = () => client.get('/settings').then(r => r.data)
export const updateSetting = (key, value) => client.put(`/settings/${key}`, { value }).then(r => r.data)

// Allocation Rules
export const getAllocationRules = () => client.get('/allocation-rules').then(r => r.data)
export const createAllocationRule = (data) => client.post('/allocation-rules', data).then(r => r.data)
export const updateAllocationRule = (id, data) => client.patch(`/allocation-rules/${id}`, data).then(r => r.data)
export const deleteAllocationRule = (id) => client.delete(`/allocation-rules/${id}`)
export const calculateAllocation = (amount) => client.get('/allocation-rules/calculate', { params: { amount } }).then(r => r.data)
