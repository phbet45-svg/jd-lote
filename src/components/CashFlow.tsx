import React, { useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { Transaction } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Plus, Trash2, Tag, Loader2, BarChart3 } from 'lucide-react';

interface CashFlowProps {
  transactions: Transaction[];
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export default function CashFlow({ transactions, onSuccess, onError }: CashFlowProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    value: '',
    type: 'Entrada' as 'Entrada' | 'Saída',
    category: 'Vendas'
  });

  // Calculate stats
  const totalIn = transactions
    .filter(t => t.type === 'Entrada')
    .reduce((sum, t) => sum + t.value, 0);

  const totalOut = transactions
    .filter(t => t.type === 'Saída')
    .reduce((sum, t) => sum + t.value, 0);

  const currentBalance = totalIn - totalOut;

  // Group by category for visual charts
  const categoryTotals: { [key: string]: { in: number; out: number } } = {};
  transactions.forEach(t => {
    if (!categoryTotals[t.category]) {
      categoryTotals[t.category] = { in: 0, out: 0 };
    }
    if (t.type === 'Entrada') {
      categoryTotals[t.category].in += t.value;
    } else {
      categoryTotals[t.category].out += t.value;
    }
  });

  const categories = Object.keys(categoryTotals);
  const maxVal = Math.max(...categories.map(c => Math.max(categoryTotals[c].in, categoryTotals[c].out)), 1000);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.value || !form.date) {
      onError('Por favor, preencha todos os campos da movimentação.');
      return;
    }

    setLoading(true);
    try {
      const transactionData: Transaction = {
        date: form.date,
        description: form.description,
        value: parseFloat(form.value) || 0,
        type: form.type,
        category: form.category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'transactions'), transactionData);
      onSuccess(`Movimentação "${form.description}" registrada com sucesso!`);
      
      // Reset form (keeping date and type for consecutive entries)
      setForm(prev => ({
        ...prev,
        description: '',
        value: ''
      }));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'transactions');
      onError('Falha ao registrar movimentação.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id?: string, desc?: string) => {
    if (!id) return;
    if (!window.confirm(`Tem certeza que deseja excluir a movimentação "${desc}"?`)) return;

    try {
      await deleteDoc(doc(db, 'transactions', id));
      onSuccess('Movimentação excluída com sucesso.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `transactions/${id}`);
      onError('Erro ao excluir movimentação.');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="cash-flow-panel">
      {/* Coluna 1 e 2: Lançamento e Gráfico */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Kpis Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#121c15] border border-[#2d3a31] rounded-2xl p-5 shadow-lg flex items-center gap-4">
            <div className="p-3 bg-[#102a18] text-emerald-400 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Total Entradas</p>
              <h4 className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(totalIn)}</h4>
            </div>
          </div>

          <div className="bg-[#121c15] border border-[#2d3a31] rounded-2xl p-5 shadow-lg flex items-center gap-4">
            <div className="p-3 bg-[#2d1215] text-rose-400 rounded-xl">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Total Saídas</p>
              <h4 className="text-xl font-bold text-rose-400 mt-1">{formatCurrency(totalOut)}</h4>
            </div>
          </div>

          <div className="bg-[#121c15] border border-[#2d3a31] rounded-2xl p-5 shadow-lg flex items-center gap-4">
            <div className="p-3 bg-[#232014] text-amber-400 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Saldo de Caixa</p>
              <h4 className={`text-xl font-bold mt-1 ${currentBalance >= 0 ? 'text-amber-400' : 'text-rose-500'}`}>
                {formatCurrency(currentBalance)}
              </h4>
            </div>
          </div>
        </div>

        {/* Custom Visual SVG/HTML Chart */}
        <div className="bg-[#121c15] border border-[#2d3a31] rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              <h3 className="text-md font-bold text-[#F5F2EB]">Entradas vs Saídas por Categoria</h3>
            </div>
            <span className="text-[10px] bg-amber-400/10 text-amber-400 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
              Balancete Geral
            </span>
          </div>

          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-[#2d3a31] rounded-xl">
              <BarChart3 className="w-12 h-12 text-gray-600 mb-2" />
              <p className="text-sm text-gray-400">Nenhuma movimentação para exibir no gráfico.</p>
            </div>
          ) : (
            <div className="space-y-5" id="cash-flow-category-chart">
              {categories.map((cat, idx) => {
                const inPct = (categoryTotals[cat].in / maxVal) * 100;
                const outPct = (categoryTotals[cat].out / maxVal) * 100;

                return (
                  <div key={idx} className="space-y-1.5 border-b border-[#2d3a31]/30 pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-300">{cat}</span>
                      <div className="flex gap-4 text-[10px] text-gray-400 font-mono">
                        {categoryTotals[cat].in > 0 && (
                          <span className="text-emerald-400">In: {formatCurrency(categoryTotals[cat].in)}</span>
                        )}
                        {categoryTotals[cat].out > 0 && (
                          <span className="text-rose-400">Out: {formatCurrency(categoryTotals[cat].out)}</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      {/* Entrada Bar */}
                      {categoryTotals[cat].in > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-16 text-[10px] text-gray-400 text-right shrink-0">Entrada</div>
                          <div className="flex-1 bg-[#0b120d] h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(inPct, 3)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Saída Bar */}
                      {categoryTotals[cat].out > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-16 text-[10px] text-gray-400 text-right shrink-0">Saída</div>
                          <div className="flex-1 bg-[#0b120d] h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-rose-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(outPct, 3)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Histórico Table */}
        <div className="bg-[#121c15] border border-[#2d3a31] rounded-2xl p-6 shadow-xl">
          <h3 className="text-md font-bold text-[#F5F2EB] mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            Histórico Recente de Caixa
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="transactions-table">
              <thead>
                <tr className="border-b border-[#2d3a31] text-xs text-gray-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d3a31]/40 text-sm">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500 italic">
                      Nenhum lançamento de caixa registrado.
                    </td>
                  </tr>
                ) : (
                  [...transactions]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((t, idx) => (
                      <tr key={t.id || idx} className="hover:bg-[#18261c]/40 transition">
                        <td className="py-3 px-4 text-xs text-gray-300 font-mono">
                          {t.date.split('-').reverse().join('/')}
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-100">{t.description}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/10 text-[#eed082] px-2 py-0.5 rounded border border-[#2d3a31]/50">
                            <Tag className="w-3 h-3" />
                            {t.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-bold ${
                              t.type === 'Entrada'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-right font-mono font-bold ${t.type === 'Entrada' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.type === 'Entrada' ? '+' : '-'} {formatCurrency(t.value)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDelete(t.id, t.description)}
                            className="p-1 text-gray-500 hover:text-rose-400 transition cursor-pointer"
                            title="Excluir Lançamento"
                            aria-label={`Excluir lançamento ${t.description}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Coluna 3: Registro de Fluxo */}
      <div className="bg-[#121c15] border border-[#2d3a31] rounded-2xl p-6 shadow-xl h-fit">
        <div className="flex items-center gap-2 mb-4 border-b border-[#2d3a31] pb-3">
          <Plus className="w-5 h-5 text-amber-400" />
          <h3 className="text-md font-bold text-[#F5F2EB]">Registrar Movimentação</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" id="cash-flow-entry-form">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-300 font-medium">Tipo de Transação</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, type: 'Entrada' }))}
                className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                  form.type === 'Entrada'
                    ? 'bg-[#102a18] border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/5'
                    : 'bg-[#0b120d] border-[#2d3a31] text-gray-400'
                }`}
              >
                Entrada (+)
              </button>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, type: 'Saída' }))}
                className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                  form.type === 'Saída'
                    ? 'bg-[#2d1215] border-rose-500 text-rose-400 shadow-md shadow-rose-500/5'
                    : 'bg-[#0b120d] border-[#2d3a31] text-gray-400'
                }`}
              >
                Saída (-)
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-300 font-medium">Data</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
              className="bg-[#0b120d] border border-[#2d3a31] rounded-xl px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-amber-400 transition"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-300 font-medium">Descrição</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Ex: Mensalidade Lote 12"
              className="bg-[#0b120d] border border-[#2d3a31] rounded-xl px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-amber-400 transition"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-300 font-medium">Valor (R$)</label>
            <input
              type="number"
              value={form.value}
              onChange={e => setForm(prev => ({ ...prev, value: e.target.value }))}
              placeholder="Ex: 2500"
              min="0.01"
              step="0.01"
              className="bg-[#0b120d] border border-[#2d3a31] rounded-xl px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-amber-400 transition"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-300 font-medium">Categoria</label>
            <select
              value={form.category}
              onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
              className="bg-[#0b120d] border border-[#2d3a31] rounded-xl px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-amber-400 transition h-[38px]"
            >
              {form.type === 'Entrada' ? (
                <>
                  <option value="Mensalidade Lotes">Mensalidade Lotes</option>
                  <option value="Quitação de Lotes">Quitação de Lotes</option>
                  <option value="Entrada Lotes">Entrada Lotes</option>
                  <option value="Serviços Adicionais">Serviços Adicionais</option>
                  <option value="Outros">Outros</option>
                </>
              ) : (
                <>
                  <option value="Infraestrutura">Infraestrutura</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Administrativo">Administrativo</option>
                  <option value="Impostos">Impostos</option>
                  <option value="Comissões Vendedores">Comissões Vendedores</option>
                  <option value="Outros">Outros</option>
                </>
              )}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 text-black font-semibold py-2.5 rounded-xl cursor-pointer transition shadow-lg shadow-amber-500/10"
            id="add-transaction-btn"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Salvar Registro</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
