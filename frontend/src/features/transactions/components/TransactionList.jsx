import { useState, useEffect } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import { useBalance } from '../../../contexts/BalanceContext'
import { getCategories, getAccounts } from '../../../shared/api/endpoints'
import { TransactionItem } from './TransactionItem'
import { TransactionForm } from './TransactionForm'

export function TransactionList() {
  const { transactions, loading, loadingMore, hasMore, error, filters, setFilters, add, update, remove, loadMore } = useTransactions()
  const { refresh: refreshBalance } = useBalance()
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error)
    getAccounts().then(setAccounts).catch(console.error)
  }, [])

  const handleAdd = async (data) => {
    await add(data)
    refreshBalance()
    setShowForm(false)
  }

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction)
    setShowForm(true)
  }

  const handleUpdate = async (data) => {
    await update(editingTransaction.id, data)
    refreshBalance()
    setEditingTransaction(null)
    setShowForm(false)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this transaction?')) {
      await remove(id)
      refreshBalance()
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingTransaction(null)
  }

  return (
    <div>
      <div className="page-header flex-between">
        <h1 className="page-title">[TRANSACTIONS]</h1>
        <div className="btn-group">
          <button className="btn btn--secondary" onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? 'Hide Filters' : 'Filters'}
          </button>
          {!showForm && (
            <button className="btn btn--primary" onClick={() => setShowForm(true)}>
              + Add
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="card mb-2">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                className="form-select"
                value={filters.type || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value || undefined }))}
              >
                <option value="">All</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={filters.category_id || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, category_id: e.target.value ? parseInt(e.target.value) : undefined }))}
              >
                <option value="">All</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Account</label>
              <select
                className="form-select"
                value={filters.account_id || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, account_id: e.target.value ? parseInt(e.target.value) : undefined }))}
              >
                <option value="">All</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">From</label>
              <input
                type="date"
                className="form-input"
                value={filters.start_date || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value || undefined }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">To</label>
              <input
                type="date"
                className="form-input"
                value={filters.end_date || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value || undefined }))}
              />
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="card mb-2">
          <div className="card__header">
            <h2 className="card__title">
              {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
            </h2>
          </div>
          <TransactionForm
            transaction={editingTransaction}
            onSubmit={editingTransaction ? handleUpdate : handleAdd}
            onCancel={handleCancel}
          />
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading transactions</div>
      ) : transactions.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__text">No transactions found</div>
          </div>
        </div>
      ) : (
        <>
          <div className="card">
            {transactions.map(tx => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
          {hasMore && (
            <div className="text-center mt-2">
              <button
                className="btn btn--secondary"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
