import React, { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import {
  collection,
  onSnapshot,
  getDocs,
  addDoc,
  query,
  limit,
  doc
} from 'firebase/firestore';

import { Client, Transaction, Project, Seller, SellerPermissions } from './types';
import { demoClients, demoTransactions, demoProjects } from './demoData';

import ChaletLogo from './components/ChaletLogo';
import ClientRegistration from './components/ClientRegistration';
import CashFlow from './components/CashFlow';
import ProjectsOverview from './components/ProjectsOverview';
import ClientStatus from './components/ClientStatus';
import SellersManager from './components/SellersManager';
import Toast, { ToastMessage, ToastType } from './components/Toast';

import {
  LayoutDashboard,
  Users,
  DollarSign,
  Building2,
  UserPlus,
  LogOut,
  TrendingUp,
  Briefcase,
  AlertCircle,
  FileText,
  Calendar,
  Layers,
  ChevronRight,
  Shield,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'cashflow' | 'projects' | 'new-client' | 'sellers'>('dashboard');
  const [sellerProfile, setSellerProfile] = useState<Seller | null>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  
  // App data state synced with Firestore in real-time
  const [clients, setClients] = useState<Client[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Feedback toasts list
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Login inputs
  const [loginEmail, setLoginEmail] = useState('jdloteamentos@x.com');
  const [loginPassword, setLoginPassword] = useState('jdloteamento4321');
  const [loginLoading, setLoginLoading] = useState(false);

  // Helper to add a toast message
  const addToast = (message: string, type: ToastType = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Fetch / Subscribe salesperson permissions in real-time
  useEffect(() => {
    if (!user) {
      setSellerProfile(null);
      return;
    }
    
    if (user.email === 'jdloteamentos@x.com') {
      // Administrator has full permissions
      setSellerProfile(null);
      return;
    }

    setLoadingPermissions(true);
    const docRef = doc(db, 'sellers', user.uid);
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const profile = { id: docSnap.id, ...docSnap.data() } as Seller;
        setSellerProfile(profile);
        
        // Auto-redirect if current active tab is disabled in permissions
        const perms = profile.permissions;
        const allowedTabs = Object.keys(perms).filter(k => perms[k as keyof SellerPermissions]) as ('dashboard' | 'clients' | 'cashflow' | 'projects' | 'new-client')[];
        
        if (allowedTabs.length > 0 && !perms[activeTab as keyof SellerPermissions]) {
          setActiveTab(allowedTabs[0]);
        }
      } else {
        setSellerProfile(null);
        addToast("Aviso: Seu usuário de vendedor não possui perfil de permissões configurado. Entre em contato com o administrador.", "error");
      }
      setLoadingPermissions(false);
    }, (err) => {
      console.error("Error fetching seller profile permissions:", err);
      setLoadingPermissions(false);
    });

    return unsub;
  }, [user, activeTab]);

  // Real-time Database Synchronization
  useEffect(() => {
    if (!user) {
      setClients([]);
      setTransactions([]);
      setProjects([]);
      return;
    }

    // List of collection names
    const clientsCol = collection(db, 'clients');
    const transactionsCol = collection(db, 'transactions');
    const projectsCol = collection(db, 'projects');

    // Subscribe to Clients
    const unsubClients = onSnapshot(clientsCol, (snapshot) => {
      const list: Client[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Client);
      });
      setClients(list);
    }, (err) => {
      console.error("Clients snapshot failed, likely initializing or permissions issue:", err);
    });

    // Subscribe to Transactions
    const unsubTransactions = onSnapshot(transactionsCol, (snapshot) => {
      const list: Transaction[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      setTransactions(list);
    }, (err) => {
      console.error("Transactions snapshot failed:", err);
    });

    // Subscribe to Projects
    const unsubProjects = onSnapshot(projectsCol, (snapshot) => {
      const list: Project[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Project);
      });
      setProjects(list);
    }, (err) => {
      console.error("Projects snapshot failed:", err);
    });

    return () => {
      unsubClients();
      unsubTransactions();
      unsubProjects();
    };
  }, [user]);

  // Seeding Database with Mock Data if Firestore collections are completely empty
  const handleSeedDatabase = async () => {
    addToast("Iniciando carregamento de dados de demonstração...", "info");
    try {
      // 1. Seed Projects
      const projSnap = await getDocs(collection(db, 'projects'));
      if (projSnap.empty) {
        for (const proj of demoProjects) {
          await addDoc(collection(db, 'projects'), proj);
        }
      }

      // 2. Seed Clients
      const clientSnap = await getDocs(collection(db, 'clients'));
      if (clientSnap.empty) {
        for (const client of demoClients) {
          await addDoc(collection(db, 'clients'), client);
        }
      }

      // 3. Seed Transactions
      const transSnap = await getDocs(collection(db, 'transactions'));
      if (transSnap.empty) {
        for (const trans of demoTransactions) {
          await addDoc(collection(db, 'transactions'), trans);
        }
      }

      addToast("Banco de dados populado com dados de exemplo de alta qualidade!", "success");
    } catch (err) {
      console.error("Failed to seed database, permissions or empty:", err);
      addToast("Aviso: Falha ao carregar sementes, operando com dados locais temporários se necessário.", "error");
    }
  };

  // Sign In action with Fallback for programmatic Admin registration if not found
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      addToast("Por favor, preencha o e-mail e a senha administrativa.", "error");
      return;
    }

    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      addToast("Acesso administrativo autorizado com sucesso!", "success");
    } catch (err: any) {
      // If user does not exist in Firebase Auth, register them automatically for demonstration!
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          addToast("Credenciais administrativas sendo inicializadas no Firebase...", "info");
          await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
          addToast("Conta de administrador criada e logada com sucesso!", "success");
          
          // Seed the database right after first signup!
          setTimeout(() => {
            handleSeedDatabase();
          }, 1500);
        } catch (signupErr: any) {
          console.error(signupErr);
          addToast(`Erro de autenticação: ${err.message}`, "error");
        }
      } else {
        console.error(err);
        addToast("Falha de acesso. Verifique suas credenciais de administrador.", "error");
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      addToast("Sessão administrativa finalizada com sucesso.", "info");
    } catch (err) {
      addToast("Erro ao finalizar sessão.", "error");
    }
  };

  // Dashboard Stats Calculations
  const portfolioWorth = clients.reduce((sum, c) => sum + c.valueTotal, 0);
  const totalCollected = clients.reduce((sum, c) => sum + c.valuePaid, 0);
  const totalDebt = Math.max(portfolioWorth - totalCollected, 0);

  // Cash flow balances
  const totalInflows = transactions
    .filter(t => t.type === 'Entrada')
    .reduce((sum, t) => sum + t.value, 0);
  const totalOutflows = transactions
    .filter(t => t.type === 'Saída')
    .reduce((sum, t) => sum + t.value, 0);
  const liquidCash = totalInflows - totalOutflows;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  const isTabAllowed = (tab: 'dashboard' | 'clients' | 'cashflow' | 'projects' | 'new-client' | 'sellers') => {
    if (!user) return false;
    if (user.email === 'jdloteamentos@x.com') return true; // admin has unrestricted access
    if (tab === 'sellers') return false; // salespeople cannot manage other sellers
    if (!sellerProfile) return false; // wait for profile to load
    return sellerProfile.permissions[tab as keyof SellerPermissions] === true;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-center gap-4" id="app-loader">
        <div className="animate-pulse">
          <ChaletLogo size={100} showText={false} />
        </div>
        <div className="flex items-center gap-2 text-[#0F3D1F] font-mono text-xs tracking-widest uppercase mt-4">
          <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
          <span>Verificando Credenciais...</span>
        </div>
      </div>
    );
  }

  // Render Salesperson permissions syncing view
  if (user && user.email !== 'jdloteamentos@x.com' && loadingPermissions) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-center gap-4" id="permissions-loader">
        <div className="animate-pulse">
          <ChaletLogo size={100} showText={false} />
        </div>
        <div className="flex items-center gap-2 text-[#0F3D1F] font-mono text-xs tracking-widest uppercase mt-4">
          <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
          <span>Sincronizando Permissões do Vendedor...</span>
        </div>
      </div>
    );
  }

  // Render Access Denied Panel if salesperson profile doesn't exist
  if (user && user.email !== 'jdloteamentos@x.com' && !sellerProfile && !loadingPermissions) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-center p-4" id="access-denied-container">
        <div className="w-full max-w-md bg-white border border-[#0F3D1F10] rounded-3xl p-8 shadow-xl text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 text-rose-600 rounded-full flex items-center justify-center animate-bounce">
              <ShieldAlert className="w-8 h-8" />
            </div>
          </div>
          
          <div>
            <h1 className="text-xl font-bold text-[#0F3D1F] tracking-tight">Acesso Não Autorizado</h1>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              O e-mail <strong className="text-[#0F3D1F]">{user.email}</strong> está autenticado, mas não possui permissões configuradas pelo administrador para visualizar este painel.
            </p>
          </div>

          <div className="bg-[#FDFCF8] border border-gray-100 p-4 rounded-2xl text-left">
            <h4 className="text-xs font-bold text-[#0F3D1F] uppercase tracking-wider">O que fazer?</h4>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed font-sans">
              Entre em contato com o gerente geral para obter um convite de vendedor e configurar seus canais de visualização de lotes.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-[#0F3D1F] hover:bg-[#0c331a] text-[#D4AF37] font-bold text-sm py-3.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Voltar ao Login</span>
          </button>
        </div>
      </div>
    );
  }

  // Render Login Panel
  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center px-4 relative overflow-hidden" id="login-container">
        {/* Visual elegant background accents */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#0F3D1F] opacity-5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500 opacity-5 blur-[150px]" />

        <div className="w-full max-w-md bg-white border border-[#0F3D1F10] rounded-3xl p-8 shadow-xl relative z-10 animate-slide-in">
          <div className="flex flex-col items-center text-center mb-8">
            <ChaletLogo size={90} showText={true} textColor="text-[#0F3D1F]" subtextColor="text-[#D4AF37]" />
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#0F3D1F10] to-transparent my-6" />
            <h1 className="text-xl font-bold tracking-tight text-[#1A1A1A] font-display">Painel Administrativo</h1>
            <p className="text-xs text-gray-500 mt-1">Insira suas credenciais exclusivas para gerenciar loteamentos</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5" id="login-form">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-700">E-mail Corporativo</label>
              <input
                type="email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                placeholder="nome@empresa.com"
                className="bg-[#FDFCF8] border border-[#0F3D1F15] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition placeholder-gray-400 font-medium"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-700">Senha Secreta</label>
                <span className="text-[10px] text-[#D4AF37] font-semibold cursor-default">Administrador Geral</span>
              </div>
              <input
                type="password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-[#FDFCF8] border border-[#0F3D1F15] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 transition placeholder-gray-400 font-medium"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-[#0F3D1F] hover:bg-[#0b2b16] text-[#D4AF37] font-bold text-sm py-3.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.99] mt-2"
              id="submit-login-btn"
            >
              {loginLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>Autenticar no Sistema</span>
              )}
            </button>
          </form>

          {/* Quick Info Box */}
          <div className="mt-8 bg-[#FDFCF8] border border-[#0F3D1F10] rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-[#0F3D1F]">Ambiente de Demonstração Seguro</h4>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                As credenciais padrão foram configuradas pelo sistema. Se o usuário administrativo não estiver presente, ele será provisionado automaticamente no Firebase Auth.
              </p>
            </div>
          </div>
        </div>

        {/* Floating Toasts container inside login */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
          {toasts.map(t => (
            <Toast key={t.id} toast={t} onClose={removeToast} />
          ))}
        </div>
      </div>
    );
  }

  // Render Admin Dashboard
  return (
    <div className="min-h-screen bg-[#FDFCF8] flex" id="dashboard-shell">
      
      {/* 1. FIXED SIDEBAR LAYOUT */}
      <aside className="w-72 bg-[#0F3D1F] border-r border-[#ffffff10] flex flex-col justify-between shrink-0 fixed top-0 bottom-0 left-0 z-30" id="sidebar">
        
        {/* Top Header Logo */}
        <div className="p-6 border-b border-[#ffffff10]">
          <ChaletLogo size={54} textColor="text-[#D4AF37]" subtextColor="text-white/70" />
        </div>

        {/* Main Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-2" id="sidebar-nav">
          {isTabAllowed('dashboard') && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37] shadow-sm'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Visão Geral</span>
            </button>
          )}

          {isTabAllowed('clients') && (
            <button
              onClick={() => setActiveTab('clients')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'clients'
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37] shadow-sm'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Quitação de Lotes</span>
            </button>
          )}

          {isTabAllowed('cashflow') && (
            <button
              onClick={() => setActiveTab('cashflow')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'cashflow'
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37] shadow-sm'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <DollarSign className="w-5 h-5" />
              <span>Fluxo de Caixa</span>
            </button>
          )}

          {isTabAllowed('projects') && (
            <button
              onClick={() => setActiveTab('projects')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'projects'
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37] shadow-sm'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Building2 className="w-5 h-5" />
              <span>Loteamentos</span>
            </button>
          )}

          {isTabAllowed('new-client') && (
            <button
              onClick={() => setActiveTab('new-client')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'new-client'
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37] shadow-sm'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <UserPlus className="w-5 h-5" />
              <span>Cadastrar Comprador</span>
            </button>
          )}

          {user && user.email === 'jdloteamentos@x.com' && (
            <button
              onClick={() => setActiveTab('sellers')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'sellers'
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37] shadow-sm'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Shield className="w-5 h-5" />
              <span>Vendedores & Acessos</span>
            </button>
          )}
        </nav>

        {/* User Info & Logout Controls */}
        <div className="p-4 border-t border-[#ffffff10] space-y-4 bg-[#0A2B15]">
          {/* User Profile info */}
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-[#D4AF37] flex items-center justify-center font-bold text-[#0F3D1F] text-sm select-none">
              {user.email === 'jdloteamentos@x.com' ? 'JD' : (sellerProfile?.name ? sellerProfile.name.substring(0, 2).toUpperCase() : 'VD')}
            </div>
            <div className="flex-grow min-w-0">
              <h4 className="text-xs font-bold text-white truncate">
                {user.email === 'jdloteamentos@x.com' ? 'JD Loteamentos' : (sellerProfile?.name || 'Vendedor')}
              </h4>
              <p className="text-[10px] text-white/60 truncate font-mono">{user.email}</p>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-bold rounded-xl transition cursor-pointer"
            id="logout-btn"
          >
            <LogOut className="w-4 h-4" />
            <span>Finalizar Sessão</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN VIEWPORT CONTAINER */}
      <main className="flex-grow pl-72 min-h-screen flex flex-col bg-[#FDFCF8]" id="main-viewport">
        
        {/* Top Navigation Bar */}
        <header className="h-20 border-b border-[#00000010] flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase font-bold">Painel de Controle</span>
            <h1 className="text-lg font-bold text-[#0F3D1F] mt-0.5 tracking-tight font-display">
              {activeTab === 'dashboard' && 'Visão Geral Executiva'}
              {activeTab === 'clients' && 'Controle de Quitação & Carteira'}
              {activeTab === 'cashflow' && 'Movimento Financeiro de Caixa'}
              {activeTab === 'projects' && 'Loteamentos & Progresso Físico'}
              {activeTab === 'new-client' && 'Cadastro Técnico de Clientes'}
              {activeTab === 'sellers' && 'Gerenciamento de Vendedores & Permissões'}
            </h1>
          </div>

          {/* Real-time sync indicator */}
          <div className="flex items-center gap-2.5 bg-green-50 border border-green-100 px-4 py-2 rounded-xl">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-mono text-green-700 tracking-wide font-bold">Firestore Real-Time</span>
          </div>
        </header>

        {/* Viewport Content */}
        <div className="p-8 flex-grow space-y-6 animate-fade-in">
          
          {/* TAB 1: VISÃO GERAL (Dashboard) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6" id="executive-dashboard-view">
              
              {/* Top Bento Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Stat 1: Total Contratos */}
                <div className="bg-white border border-[#0F3D1F10] rounded-2xl p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Briefcase className="w-24 h-24 text-[#0F3D1F]" />
                  </div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block">Carteira Total</span>
                  <h3 className="text-2xl font-bold text-[#0F3D1F] mt-2 font-mono">{formatCurrency(portfolioWorth)}</h3>
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="text-[#D4AF37] font-bold font-mono">{clients.length}</span>
                    <span>contratos assinados</span>
                  </div>
                </div>

                {/* Stat 2: Total Recebido */}
                <div className="bg-white border border-[#0F3D1F10] rounded-2xl p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <TrendingUp className="w-24 h-24 text-emerald-600" />
                  </div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block">Total Recebido</span>
                  <h3 className="text-2xl font-bold text-emerald-700 mt-2 font-mono">{formatCurrency(totalCollected)}</h3>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden p-[1px]">
                      <div
                        className="bg-emerald-600 h-full rounded-full"
                        style={{ width: `${portfolioWorth > 0 ? (totalCollected / portfolioWorth) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono font-bold shrink-0">
                      {portfolioWorth > 0 ? Math.round((totalCollected / portfolioWorth) * 100) : 0}%
                    </span>
                  </div>
                </div>

                {/* Stat 3: Saldo Devedor */}
                <div className="bg-white border border-[#0F3D1F10] rounded-2xl p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <AlertCircle className="w-24 h-24 text-[#D4AF37]" />
                  </div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block">Saldo de Recebíveis</span>
                  <h3 className="text-2xl font-bold text-amber-600 mt-2 font-mono">{formatCurrency(totalDebt)}</h3>
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-500">
                    <span>A amortizar a médio prazo</span>
                  </div>
                </div>

                {/* Stat 4: Caixa Líquido */}
                <div className="bg-white border border-[#0F3D1F10] rounded-2xl p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <DollarSign className="w-24 h-24 text-emerald-600" />
                  </div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block">Disponibilidade de Caixa</span>
                  <h3 className={`text-2xl font-bold mt-2 font-mono ${liquidCash >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {formatCurrency(liquidCash)}
                  </h3>
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-500">
                    <span>Fluxo operacional consolidado</span>
                  </div>
                </div>

              </div>

              {/* Central double split: Cash flow list & construction summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Construction summary */}
                <div className="bg-white border border-[#0F3D1F10] rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <h3 className="text-md font-bold text-[#0F3D1F] flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#D4AF37]" />
                      Status dos Empreendimentos
                    </h3>
                    <button
                      onClick={() => setActiveTab('projects')}
                      className="text-xs text-[#D4AF37] hover:text-[#b59228] font-bold cursor-pointer flex items-center gap-1"
                    >
                      <span>Ver Todos</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {projects.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-6">Nenhum empreendimento cadastrado.</p>
                    ) : (
                      projects.slice(0, 3).map((proj, idx) => (
                        <div key={proj.id || idx} className="bg-[#FDFCF8] border border-[#0F3D1F10] p-4 rounded-xl space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-[#1A1A1A]">{proj.name}</span>
                            <span className="text-[10px] font-mono font-bold text-[#D4AF37]">{proj.progress}% concluído</span>
                          </div>
                          
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden p-[1px]">
                            <div className="bg-[#0F3D1F] h-full rounded-full" style={{ width: `${proj.progress}%` }} />
                          </div>

                          <div className="flex justify-between items-center text-[11px] text-gray-500 pt-1">
                            <span>Lotes: {proj.soldLots} vendidos de {proj.totalLots}</span>
                            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">{proj.status}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recente transactions flow */}
                <div className="bg-white border border-[#0F3D1F10] rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <h3 className="text-md font-bold text-[#0F3D1F] flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#D4AF37]" />
                      Últimos Lançamentos Financeiros
                    </h3>
                    <button
                      onClick={() => setActiveTab('cashflow')}
                      className="text-xs text-[#D4AF37] hover:text-[#b59228] font-bold cursor-pointer flex items-center gap-1"
                    >
                      <span>Ver Todos</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {transactions.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-6">Nenhuma movimentação lançada.</p>
                    ) : (
                      [...transactions]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 4)
                        .map((t, idx) => (
                          <div key={t.id || idx} className="flex items-center justify-between p-3 bg-[#FDFCF8] border border-[#0F3D1F10]/40 rounded-xl">
                            <div>
                              <h4 className="text-sm font-bold text-[#1A1A1A]">{t.description}</h4>
                              <span className="text-[10px] text-gray-500 font-mono mt-0.5 inline-block">{t.category} • {t.date.split('-').reverse().join('/')}</span>
                            </div>

                            <span className={`text-xs font-bold font-mono ${t.type === 'Entrada' ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {t.type === 'Entrada' ? '+' : '-'} {formatCurrency(t.value)}
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </div>

              </div>

              {/* Quick Info / Tips Alert */}
              <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-2xl p-5 flex gap-4 items-start">
                <ShieldAlert className="w-6 h-6 text-[#0F3D1F] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-[#0F3D1F]">Orientação Técnica e Financeira</h4>
                  <p className="text-xs text-gray-700 mt-1 leading-relaxed">
                    A JD Loteamentos opera em conformidade com as regras tributárias e fiscais. O controle de caixa é sincronizado em tempo real com o banco de dados seguro do Firestore. Para lançar novas vendas, cadastre o cliente no formulário técnico com as respectivas informações de lote e contrato para automatizar as previsões de recebimento.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CLIENT STATUS */}
          {activeTab === 'clients' && (
            <ClientStatus
              clients={clients}
              onSuccess={(msg) => addToast(msg, 'success')}
              onError={(msg) => addToast(msg, 'error')}
            />
          )}

          {/* TAB 3: CASH FLOW */}
          {activeTab === 'cashflow' && (
            <CashFlow
              transactions={transactions}
              onSuccess={(msg) => addToast(msg, 'success')}
              onError={(msg) => addToast(msg, 'error')}
            />
          )}

          {/* TAB 4: PROJECTS OVERVIEW */}
          {activeTab === 'projects' && (
            <ProjectsOverview
              projects={projects}
              onSuccess={(msg) => addToast(msg, 'success')}
              onError={(msg) => addToast(msg, 'error')}
            />
          )}

          {/* TAB 5: NEW CLIENT */}
          {activeTab === 'new-client' && (
            <ClientRegistration
              onSuccess={(msg) => {
                addToast(msg, 'success');
                setActiveTab('clients'); // Redirect to client list upon success
              }}
              onError={(msg) => addToast(msg, 'error')}
            />
          )}

          {/* TAB 6: SELLERS MANAGER */}
          {activeTab === 'sellers' && user && user.email === 'jdloteamentos@x.com' && (
            <SellersManager
              onSuccess={(msg) => addToast(msg, 'success')}
              onError={(msg) => addToast(msg, 'error')}
            />
          )}

        </div>
      </main>

      {/* Floating Notifications List */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        {toasts.map(t => (
          <Toast key={t.id} toast={t} onClose={removeToast} />
        ))}
      </div>

    </div>
  );
}
