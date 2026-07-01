import React, { useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Client } from '../types';
import { UserPlus, Loader2, CheckCircle2 } from 'lucide-react';

interface ClientRegistrationProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export default function ClientRegistration({ onSuccess, onError }: ClientRegistrationProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    rg: '',
    phone: '',
    email: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    zip: '',
    lot: '',
    valueTotal: '',
    valuePaid: '',
    status: 'Em dia' as 'Em dia' | 'Atrasado' | 'Quitado'
  });

  // Simple mask for CPF (999.999.999-99)
  const formatCPF = (value: string) => {
    const raw = value.replace(/\D/g, '');
    if (raw.length <= 3) return raw;
    if (raw.length <= 6) return `${raw.slice(0, 3)}.${raw.slice(3)}`;
    if (raw.length <= 9) return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
    return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9, 11)}`;
  };

  // Simple mask for Phone ((99) 99999-9999)
  const formatPhone = (value: string) => {
    const raw = value.replace(/\D/g, '');
    if (raw.length <= 2) return raw;
    if (raw.length <= 7) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`;
  };

  // Simple mask for CEP (99999-999)
  const formatCEP = (value: string) => {
    const raw = value.replace(/\D/g, '');
    if (raw.length <= 5) return raw;
    return `${raw.slice(0, 5)}-${raw.slice(5, 8)}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cpf') {
      formattedValue = formatCPF(value);
    } else if (name === 'phone') {
      formattedValue = formatPhone(value);
    } else if (name === 'zip') {
      formattedValue = formatCEP(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.cpf || !formData.lot || !formData.valueTotal) {
      onError('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    setLoading(true);
    try {
      const valTotalNum = parseFloat(formData.valueTotal) || 0;
      const valPaidNum = parseFloat(formData.valuePaid) || 0;
      
      // Auto-compute status if desired
      let finalStatus = formData.status;
      if (valPaidNum >= valTotalNum && valTotalNum > 0) {
        finalStatus = 'Quitado';
      }

      const clientData: Client = {
        name: formData.name,
        cpf: formData.cpf,
        rg: formData.rg,
        phone: formData.phone,
        email: formData.email,
        address: {
          street: formData.street,
          number: formData.number,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          zip: formData.zip
        },
        lot: formData.lot,
        valueTotal: valTotalNum,
        valuePaid: valPaidNum,
        status: finalStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const path = 'clients';
      await addDoc(collection(db, path), clientData);

      onSuccess(`Cliente ${formData.name} cadastrado com sucesso!`);
      
      // Reset form
      setFormData({
        name: '',
        cpf: '',
        rg: '',
        phone: '',
        email: '',
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        zip: '',
        lot: '',
        valueTotal: '',
        valuePaid: '',
        status: 'Em dia'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'clients');
      onError('Falha ao cadastrar cliente no banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121c15] border border-[#2d3a31] rounded-2xl p-6 shadow-xl" id="client-registration-panel">
      <div className="flex items-center gap-3 mb-6 border-b border-[#2d3a31] pb-4">
        <UserPlus className="w-6 h-6 text-amber-400" />
        <div>
          <h2 className="text-xl font-bold text-[#F5F2EB]">Cadastro de Novo Cliente</h2>
          <p className="text-xs text-gray-400">Adicione um novo comprador e lote no sistema em tempo real</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" id="client-registration-form">
        {/* Seção 1: Dados Pessoais */}
        <div>
          <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">1. Dados Pessoais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-300 font-medium">Nome Completo *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ex: João da Silva"
                className="bg-[#0b120d] border border-[#2d3a31] rounded-lg px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-amber-400 transition"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-300 font-medium">CPF *</label>
              <input
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleInputChange}
                maxLength={14}
                placeholder="000.000.000-00"
                className="bg-[#0b120d] border border-[#2d3a31] rounded-lg px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-amber-400 transition"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-300 font-medium">RG</label>
              <input
                type="text"
                name="rg"
                value={formData.rg}
                onChange={handleInputChange}
                placeholder="00.000.000-0"
                className="bg-[#0b120d] border border-[#2d3a31] rounded-lg px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-amber-400 transition"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-300 font-medium">Celular *</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                maxLength={15}
                placeholder="(00) 00000-0000"
                className="bg-[#0b120d] border border-[#2d3a31] rounded-lg px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-amber-400 transition"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs text-gray-300 font-medium">E-mail *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="email@cliente.com"
                className="bg-[#0b120d] border border-[#2d3a31] rounded-lg px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-amber-400 transition"
                required
              />
            </div>
          </div>
        </div>

        {/* Seção 2: Endereço */}
        <div>
          <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">2. Endereço Completo</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs text-gray-300 font-medium">Rua / Logradouro *</label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                placeholder="Ex: Rua das Flores"
                className="bg-[#0b120d] border border-[#2d3a31] rounded-lg px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-amber-400 transition"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-300 font-medium">Número *</label>
              <input
                type="text"
                name="number"
                value={formData.number}
                onChange={handleInputChange}
                placeholder="123"
                className="bg-[#0b120d] border border-[#2d3a31] rounded-lg px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-amber-400 transition"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-300 font-medium">Bairro *</label>
              <input
                type="text"
                name="neighborhood"
                value={formData.neighborhood}
                onChange={handleInputChange}
                placeholder="Ex: Centro"
                className="bg-[#0b120d] border border-[#2d3a31] rounded-lg px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-amber-400 transition"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs text-gray-300 font-medium">Cidade *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Ex: Campos do Jordão"
                className="bg-[#0b120d] border border-[#2d3a31] rounded-lg px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-amber-400 transition"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-300 font-medium">Estado *</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                maxLength={2}
                placeholder="SP"
                className="bg-[#0b120d] border border-[#2d3a31] rounded-lg px-3 py-2 text-sm text-[#F5F2EB] uppercase focus:outline-none focus:border-amber-400 transition"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-300 font-medium">CEP *</label>
              <input
                type="text"
                name="zip"
                value={formData.zip}
                onChange={handleInputChange}
                maxLength={9}
                placeholder="00000-000"
                className="bg-[#0b120d] border border-[#2d3a31] rounded-lg px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-amber-400 transition"
                required
              />
            </div>
          </div>
        </div>

        {/* Seção 3: Detalhes da Compra / Loteamento */}
        <div>
          <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">3. Contrato & Lote</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-300 font-medium">Loteamento e Lote *</label>
              <input
                type="text"
                name="lot"
                value={formData.lot}
                onChange={handleInputChange}
                placeholder="Alpes Verdes - Q. A Lote 12"
                className="bg-[#0b120d] border border-[#2d3a31] rounded-lg px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-amber-400 transition"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-300 font-medium">Valor Total do Contrato (R$) *</label>
              <input
                type="number"
                name="valueTotal"
                value={formData.valueTotal}
                onChange={handleInputChange}
                placeholder="150000"
                min="0"
                step="0.01"
                className="bg-[#0b120d] border border-[#2d3a31] rounded-lg px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-amber-400 transition"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-300 font-medium">Valor Pago Inicial (R$)</label>
              <input
                type="number"
                name="valuePaid"
                value={formData.valuePaid}
                onChange={handleInputChange}
                placeholder="30000"
                min="0"
                step="0.01"
                className="bg-[#0b120d] border border-[#2d3a31] rounded-lg px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-amber-400 transition"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-300 font-medium">Status de Quitação</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="bg-[#0b120d] border border-[#2d3a31] rounded-lg px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-amber-400 transition h-[38px]"
              >
                <option value="Em dia">Em dia</option>
                <option value="Atrasado">Atrasado</option>
                <option value="Quitado">Quitado</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold text-sm px-6 py-2.5 rounded-xl cursor-pointer disabled:opacity-50 transition shadow-lg shadow-amber-500/10 active:scale-[0.98]"
            id="register-client-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando no Firestore...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Cadastrar Cliente</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
