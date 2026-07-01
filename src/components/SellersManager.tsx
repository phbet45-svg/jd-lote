import React, { useState, useEffect } from 'react';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Seller, SellerPermissions } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  UserPlus,
  Users,
  Shield,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  Key,
  LayoutDashboard,
  Building2,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

interface SellersManagerProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export default function SellersManager({ onSuccess, onError }: SellersManagerProps) {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Permissions state
  const [permissions, setPermissions] = useState<SellerPermissions>({
    dashboard: true,
    clients: true,
    cashflow: false,
    projects: true,
    'new-client': true
  });

  // Subscribe to sellers collection in real-time
  useEffect(() => {
    const sellersCol = collection(db, 'sellers');
    const unsubscribe = onSnapshot(sellersCol, (snapshot) => {
      const list: Seller[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Seller);
      });
      setSellers(list);
      setLoadingList(false);
    }, (err) => {
      console.error("Failed to sync sellers:", err);
      onError("Erro ao carregar lista de vendedores.");
      setLoadingList(false);
    });

    return unsubscribe;
  }, [onError]);

  // Handle register new seller
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      onError('Por favor, preencha todos os campos do vendedor.');
      return;
    }

    if (password.length < 6) {
      onError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setSubmitting(true);
    let tempApp;
    try {
      // 1. Create user in Firebase Auth using secondary app instance so admin remains logged in!
      const tempAppName = `temp-seller-reg-${Date.now()}`;
      tempApp = initializeApp(firebaseConfig, tempAppName);
      const tempAuth = getAuth(tempApp);
      
      const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
      const uid = userCredential.user.uid;

      // 2. Save seller document in Firestore
      const sellerData: Seller = {
        name,
        email: email.toLowerCase().trim(),
        permissions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const path = `sellers/${uid}`;
      try {
        await setDoc(doc(db, 'sellers', uid), sellerData);
        onSuccess(`Vendedor ${name} cadastrado com sucesso!`);
        
        // Reset form
        setName('');
        setEmail('');
        setPassword('');
        setPermissions({
          dashboard: true,
          clients: true,
          cashflow: false,
          projects: true,
          'new-client': true
        });
      } catch (dbErr) {
        handleFirestoreError(dbErr, OperationType.WRITE, path);
      }
    } catch (err: any) {
      console.error("Register seller error:", err);
      if (err.code === 'auth/email-already-in-use') {
        onError('Este e-mail de vendedor já está cadastrado.');
      } else {
        onError(`Erro ao cadastrar vendedor: ${err.message || err}`);
      }
    } finally {
      if (tempApp) {
        try {
          await deleteApp(tempApp);
        } catch (delErr) {
          console.error("Error deleting secondary app:", delErr);
        }
      }
      setSubmitting(false);
    }
  };

  // Toggle permission flag
  const handleTogglePermission = (key: keyof SellerPermissions) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Start edit seller permissions
  const handleStartEdit = (seller: Seller) => {
    setEditingId(seller.id || null);
    setName(seller.name);
    setEmail(seller.email);
    setPermissions(seller.permissions);
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setEmail('');
    setPassword('');
    setPermissions({
      dashboard: true,
      clients: true,
      cashflow: false,
      projects: true,
      'new-client': true
    });
  };

  // Save edited seller permissions
  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (!name) {
      onError('O nome do vendedor não pode ser vazio.');
      return;
    }

    setSubmitting(true);
    const path = `sellers/${editingId}`;
    try {
      await updateDoc(doc(db, 'sellers', editingId), {
        name,
        permissions,
        updatedAt: new Date().toISOString()
      });
      onSuccess('Permissões do vendedor atualizadas com sucesso!');
      handleCancelEdit();
    } catch (err) {
      console.error(err);
      onError('Falha ao atualizar permissões.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete seller (revokes Firestore access permissions instantly)
  const handleDeleteSeller = async (id: string, sellerName: string) => {
    if (!window.confirm(`Deseja realmente excluir o vendedor ${sellerName}? Isso revogará instantaneamente seu acesso ao site.`)) {
      return;
    }

    const path = `sellers/${id}`;
    try {
      await deleteDoc(doc(db, 'sellers', id));
      onSuccess(`Vendedor ${sellerName} excluído do banco. Acesso revogado.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  return (
    <div className="space-y-8" id="sellers-manager-container">
      {/* Upper info alert banner */}
      <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-2xl p-5 flex gap-4 items-start" id="sellers-alert-banner">
        <Shield className="w-6 h-6 text-[#0F3D1F] shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-[#0F3D1F]">Gestão Avançada de Perfis e Permissões</h4>
          <p className="text-xs text-gray-700 mt-1 leading-relaxed">
            Como administrador principal, você pode cadastrar novos vendedores. Defina os privilégios exatos para cada perfil. Ao desmarcar uma permissão, o vendedor correspondente perderá acesso imediato e síncrono àquela seção do site através das regras de segurança nativas do Firestore.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Form panel: Register or Edit salesperson */}
        <div className="lg:col-span-5 bg-white border border-[#0F3D1F10] rounded-3xl p-6 shadow-sm space-y-6" id="seller-form-panel">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-md font-bold text-[#0F3D1F] flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#D4AF37]" />
              {editingId ? 'Editar Vendedor' : 'Cadastrar Novo Vendedor'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {editingId ? 'Ajuste os dados e permissões do vendedor selecionado' : 'Registre credenciais exclusivas e gerencie as permissões de acesso.'}
            </p>
          </div>

          <form onSubmit={editingId ? (e) => e.preventDefault() : handleRegister} className="space-y-5" id="seller-action-form">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#0F3D1F] uppercase tracking-wider block">Nome Completo *</label>
              <input
                type="text"
                required
                placeholder="Ex: João da Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-[#FDFCF8] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0F3D1F] transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#0F3D1F] uppercase tracking-wider block">E-mail do Vendedor *</label>
              <input
                type="email"
                required
                disabled={!!editingId}
                placeholder="vendedor@jdloteamentos.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 bg-[#FDFCF8] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0F3D1F] transition ${editingId ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>

            {!editingId && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0F3D1F] uppercase tracking-wider block">Senha de Acesso *</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="Mínimo de 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#FDFCF8] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0F3D1F] transition"
                  />
                  <Key className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                </div>
              </div>
            )}

            {/* Permissions Checkbox / Switch Board */}
            <div className="space-y-3 bg-[#FDFCF8] border border-gray-100 p-4 rounded-2xl" id="permissions-board">
              <span className="text-xs font-bold text-[#0F3D1F] uppercase tracking-wider block border-b border-gray-100 pb-2">
                Configuração de Permissões (Visualização)
              </span>

              <div className="space-y-3 pt-1">
                {/* 1. Dashboard */}
                <label className="flex items-center justify-between cursor-pointer py-1">
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">Visão Geral Executiva</span>
                      <span className="text-[10px] text-gray-400">Ver faturamento total, saldo e gráficos rápidos</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissions.dashboard}
                    onChange={() => handleTogglePermission('dashboard')}
                    className="w-4 h-4 rounded border-gray-300 text-[#0F3D1F] focus:ring-[#0F3D1F]"
                  />
                </label>

                {/* 2. Clients */}
                <label className="flex items-center justify-between cursor-pointer py-1">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">Visualizar Clientes</span>
                      <span className="text-[10px] text-gray-400">Ver carteira e histórico de pagamentos de lotes</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissions.clients}
                    onChange={() => handleTogglePermission('clients')}
                    className="w-4 h-4 rounded border-gray-300 text-[#0F3D1F] focus:ring-[#0F3D1F]"
                  />
                </label>

                {/* 3. New Client / Register */}
                <label className="flex items-center justify-between cursor-pointer py-1">
                  <div className="flex items-center gap-2.5">
                    <UserPlus className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">Cadastrar Comprador</span>
                      <span className="text-[10px] text-gray-400">Registrar novos contratos e compradores</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissions['new-client']}
                    onChange={() => handleTogglePermission('new-client')}
                    className="w-4 h-4 rounded border-gray-300 text-[#0F3D1F] focus:ring-[#0F3D1F]"
                  />
                </label>

                {/* 4. Projects */}
                <label className="flex items-center justify-between cursor-pointer py-1">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">Status de Empreendimentos</span>
                      <span className="text-[10px] text-gray-400">Acompanhar andamento físico de loteamentos</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissions.projects}
                    onChange={() => handleTogglePermission('projects')}
                    className="w-4 h-4 rounded border-gray-300 text-[#0F3D1F] focus:ring-[#0F3D1F]"
                  />
                </label>

                {/* 5. Cash Flow */}
                <label className="flex items-center justify-between cursor-pointer py-1">
                  <div className="flex items-center gap-2.5">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">Movimentação de Caixa</span>
                      <span className="text-[10px] text-gray-400">Ver entradas, saídas e lançamentos confidenciais</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={permissions.cashflow}
                    onChange={() => handleTogglePermission('cashflow')}
                    className="w-4 h-4 rounded border-gray-300 text-[#0F3D1F] focus:ring-[#0F3D1F]"
                  />
                </label>
              </div>
            </div>

            {/* Save Buttons */}
            {editingId ? (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-[#0F3D1F] hover:bg-[#0c331a] text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Salvar Alterações</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#0F3D1F] hover:bg-[#0c331a] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4 text-[#D4AF37]" />}
                <span>Adicionar Vendedor</span>
              </button>
            )}
          </form>
        </div>

        {/* List panel: Registered salespeople */}
        <div className="lg:col-span-7 bg-white border border-[#0F3D1F10] rounded-3xl p-6 shadow-sm flex flex-col h-full space-y-6" id="seller-list-panel">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-md font-bold text-[#0F3D1F] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#D4AF37]" />
              Vendedores Cadastrados ({sellers.length})
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Lista e controle de permissões de toda a equipe de vendas autorizada.
            </p>
          </div>

          <div className="flex-grow overflow-y-auto space-y-4 max-h-[500px]" id="sellers-scroll-list">
            {loadingList ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 text-[#0F3D1F] animate-spin" />
                <span className="text-xs text-gray-400">Sincronizando equipe em tempo real...</span>
              </div>
            ) : sellers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="w-12 h-12 text-[#D4AF37] opacity-40 mb-3" />
                <h4 className="text-sm font-bold text-gray-700">Nenhum vendedor cadastrado</h4>
                <p className="text-xs text-gray-400 max-w-sm mt-1">
                  Use o painel lateral para registrar os primeiros membros da sua equipe de vendas e configurar seus privilégios de visualização.
                </p>
              </div>
            ) : (
              sellers.map((seller) => (
                <div
                  key={seller.id}
                  className={`p-4 rounded-2xl border transition ${
                    editingId === seller.id
                      ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                      : 'border-gray-100 bg-[#FDFCF8] hover:border-[#0F3D1F20]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-[#0F3D1F]">{seller.name}</h4>
                      <span className="text-xs text-gray-500 block font-mono">{seller.email}</span>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleStartEdit(seller)}
                        title="Editar Permissões"
                        className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSeller(seller.id || '', seller.name)}
                        title="Excluir Vendedor"
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Badges of current permissions */}
                  <div className="mt-4 border-t border-gray-100/60 pt-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Acessos Permitidos:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {seller.permissions.dashboard && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                          Visão Geral
                        </span>
                      )}
                      {seller.permissions.clients && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                          Clientes
                        </span>
                      )}
                      {seller.permissions['new-client'] && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                          Novo Cliente
                        </span>
                      )}
                      {seller.permissions.projects && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                          Loteamentos
                        </span>
                      )}
                      {seller.permissions.cashflow && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                          Financeiro
                        </span>
                      )}
                      {!Object.values(seller.permissions).some(p => p) && (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-800 text-[10px] font-bold rounded-full border border-rose-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Nenhum Acesso
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
