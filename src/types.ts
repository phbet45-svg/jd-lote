export interface ClientAddress {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
}

export interface Client {
  id?: string;
  name: string;
  cpf: string;
  rg: string;
  phone: string;
  email: string;
  address: ClientAddress;
  lot: string;
  valueTotal: number;
  valuePaid: number;
  status: 'Em dia' | 'Atrasado' | 'Quitado';
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id?: string;
  date: string;
  description: string;
  value: number;
  type: 'Entrada' | 'Saída';
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id?: string;
  name: string;
  progress: number; // 0 - 100
  status: 'Em andamento' | 'Concluído' | 'Em planejamento';
  soldLots: number;
  totalLots: number;
  createdAt: string;
  updatedAt: string;
}

export interface SellerPermissions {
  dashboard: boolean;
  clients: boolean;
  cashflow: boolean;
  projects: boolean;
  'new-client': boolean;
}

export interface Seller {
  id?: string;
  name: string;
  email: string;
  permissions: SellerPermissions;
  createdAt: string;
  updatedAt: string;
}
