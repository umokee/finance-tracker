export function formatCurrency(amount, symbol = '$') {
  const num = parseFloat(amount) || 0
  const formatted = Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  return `${num < 0 ? '-' : ''}${symbol}${formatted}`
}

export function formatDate(dateString) {
  // Parse as local date to avoid timezone issues with YYYY-MM-DD format
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatDateShort(dateString) {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

export function formatPercent(value) {
  return `${parseFloat(value).toFixed(1)}%`
}

export function getCurrentMonthYear() {
  const now = new Date()
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear()
  }
}

export function getMonthName(month) {
  const date = new Date(2000, month - 1, 1)
  return date.toLocaleDateString('en-US', { month: 'long' })
}
