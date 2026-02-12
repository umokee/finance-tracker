import { useState } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import { TransactionItem } from './TransactionItem'
import { TransactionForm } from './TransactionForm'

export function TransactionList() {
  const { transactions, loading, error, reload, add, update, remove } = useTransactions()
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)

  const handleAdd = async (data) => {
    await add(data)
    setShowForm(false)
  }

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction)
    setShowForm(true)
  }

  const handleUpdate = async (data) => {
    await update(editingTransaction.id, data)
    setEditingTransaction(null)
    setShowForm(false)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this transaction?')) {
      await remove(id)
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
        {!showForm && (
          <button className="btn btn--primary" onClick={() => setShowForm(true)}>
            + Add Transaction
          </button>
        )}
      </div>

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
      )}
    </div>
  )
}
