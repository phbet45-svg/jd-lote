import React, { useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, updateDoc, addDoc, doc } from 'firebase/firestore';
import { Client } from '../types';
import { Search, Filter, ShieldCheck, DollarSign, Wallet, RefreshCw, Loader2, User, Phone, MapPin } from 'lucide-react';

interface ClientStatusProps {
  clients: Client[];
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export default function ClientStatus({ clients, onSuccess, onError }: ClientStatusProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Em dia' | 'Atrasado' | 'Quitado'>('Todos');
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient?.id || !paymentAmount) return;

    const amount = parseFloat(paymentAmount) || 0;
    if (amount <= 0) {
      onError('Digite um valor de pagamento válido.');
      return;
    }

    setLoading(selectedClient.id);
    try {
      const clientRef = doc(db, 'clients', selectedClient.id);
      const newValuePaid = selectedClient.valuePaid + amount;
      
      let newStatus = selectedClient.status;
      if (newValuePaid >= selectedClient.valueTotal) {
        newStatus = 'Quitado';
      } else if (selectedClient.status === 'Quitado') {
        newStatus = 'Em dia'; // Reset back if values modified
      }

      // Update client values
      await updateDoc(clientRef, {
        valuePaid: newValuePaid,
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      // Post corresponding entry transaction automatically
      const transactionData = {
        date: new Date().toISOString().split('T')[0],
        description: `Recebimento Lote - ${selectedClient.name}`,
        value: amount,
        type: 'Entrada' as 'Entrada',
        category: 'Mensalidade Lotes',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'transactions'), transactionData);

      onSuccess(`Pagamento de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)} registrado com sucesso para ${selectedClient.name}!`);
      
      setPaymentAmount('');
      setSelectedClient(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `clients/${selectedClient.id}`);
      onError('Erro ao registrar pagamento.');
    } finally {
      setLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Quitado':
        return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
      case 'Em dia':
        return 'bg-amber-50 text-amber-800 border border-amber-200';
      case 'Atrasado':
        return 'bg-rose-50 text-rose-800 border border-rose-200';
      default:
        return 'bg-gray-50 text-gray-800 border border-gray-200';
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.cpf.includes(searchTerm) || 
                          c.lot.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'Todos' || c.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6" id="client-status-panel">
      
      {/* Search and Filters */}
      <div className="bg-[#121c15] border border-[#2d3a31] rounded-2xl p-5 shadow-lg flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, CPF ou lote..."
            className="w-full bg-[#0b120d] border border-[#2d3a31] rounded-xl pl-10 pr-4 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-amber-400 transition"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-gray-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Filtrar:
          </span>
          {(['Todos', 'Em dia', 'Atrasado', 'Quitado'] as const).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                statusFilter === f
                  ? 'bg-amber-400 border-amber-400 text-black shadow-md'
                  : 'bg-[#0b120d] border-[#2d3a31] text-gray-300 hover:border-gray-500'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Registrar Pagamento Modal/Form Overlay */}
      {selectedClient && (
        <div className="bg-[#1c2720] border border-amber-400/40 rounded-2xl p-6 shadow-2xl animate-slide-in space-y-4">
          <div className="flex justify-between items-start border-b border-[#2d3a31] pb-3">
            <div>
              <h3 className="text-md font-bold text-[#F5F2EB] flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400" />
                Registrar Amortização / Recebimento
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Lançar valor pago pelo cliente {selectedClient.name}</p>
            </div>
            <button
              onClick={() => setSelectedClient(null)}
              className="text-xs text-gray-400 hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleRegisterPayment} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end" id="payment-receipt-form">
            <div>
              <span className="text-xs text-gray-400 block mb-1">Resumo Financeiro do Lote</span>
              <p className="text-xs text-gray-200">
                Total: <span className="font-mono font-bold">{formatCurrency(selectedClient.valueTotal)}</span>
              </p>
              <p className="text-xs text-gray-200 mt-1">
                Pago: <span className="font-mono text-emerald-400 font-bold">{formatCurrency(selectedClient.valuePaid)}</span>
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-300 font-medium">Valor Recebido (R$)</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                placeholder="Ex: 5000"
                min="0.01"
                step="0.01"
                className="bg-[#0b120d] border border-[#2d3a31] rounded-xl px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-amber-400 transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading === selectedClient.id}
              className="w-full h-[38px] flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 text-black font-semibold text-xs rounded-xl cursor-pointer transition shadow-lg"
              id="confirm-payment-btn"
            >
              {loading === selectedClient.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  <span>Confirmar Recebimento</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Tabela de Quitação de Clientes */}
      <div className="bg-[#121c15] border border-[#2d3a31] rounded-2xl p-6 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="clients-status-table">
            <thead>
              <tr className="border-b border-[#2d3a31] text-xs text-gray-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Comprador</th>
                <th className="py-3 px-4">Lote</th>
                <th className="py-3 px-4 text-right">Valor do Contrato</th>
                <th className="py-3 px-4 text-right">Valor Pago</th>
                <th className="py-3 px-4 text-right">Saldo Devedor</th>
                <th className="py-3 px-4 text-center">% Quitado</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d3a31]/40 text-sm">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-500 italic">
                    Nenhum cliente atende aos filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client, idx) => {
                  const debtBalance = Math.max(client.valueTotal - client.valuePaid, 0);
                  const percentPaid = client.valueTotal > 0 
                    ? Math.round((client.valuePaid / client.valueTotal) * 100) 
                    : 0;

                  return (
                    <tr key={client.id || idx} className="hover:bg-[#18261c]/40 transition">
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#F5F2EB] flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            {client.name}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono mt-0.5">CPF: {client.cpf}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs text-gray-300">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-400" />
                          {client.lot}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-gray-200">
                        {formatCurrency(client.valueTotal)}
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-emerald-400 font-medium">
                        {formatCurrency(client.valuePaid)}
                      </td>
                      <td className={`py-4 px-4 text-right font-mono font-bold ${debtBalance > 0 ? 'text-amber-500/90' : 'text-gray-400'}`}>
                        {formatCurrency(debtBalance)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className="text-xs font-mono font-bold text-gray-200">{percentPaid}%</span>
                          <div className="w-16 bg-[#0b120d] h-1.5 rounded-full overflow-hidden p-[1px]">
                            <div
                              className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all"
                              style={{ width: `${percentPaid}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${getStatusColor(client.status)}`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {client.status !== 'Quitado' ? (
                          <button
                            onClick={() => {
                              setSelectedClient(client);
                              setPaymentAmount('');
                            }}
                            className="bg-[#102a18] border border-emerald-500/30 hover:border-emerald-400 text-emerald-400 font-bold text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition active:scale-95 flex items-center gap-1 mx-auto"
                            id={`pay-btn-${client.id || idx}`}
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Receber</span>
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-500/80 font-bold flex items-center justify-center gap-1">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            Quitado
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
