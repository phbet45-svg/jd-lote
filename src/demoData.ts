import { Client, Transaction, Project } from './types';

export const demoClients: Client[] = [
  {
    name: "João da Silva Sauro",
    cpf: "123.456.789-00",
    rg: "12.345.678-9",
    phone: "(11) 98765-4321",
    email: "joaosauro@gmail.com",
    address: {
      street: "Avenida das Hortênsias",
      number: "1240",
      neighborhood: "Vale das Flores",
      city: "Gramado",
      state: "RS",
      zip: "95670-000"
    },
    lot: "Alpes Verdes - Quadra A, Lote 12",
    valueTotal: 150000,
    valuePaid: 120000,
    status: "Em dia",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "Maria de Oliveira Souza",
    cpf: "987.654.321-11",
    rg: "98.765.432-1",
    phone: "(54) 99123-4567",
    email: "maria.souza@yahoo.com.br",
    address: {
      street: "Rua das Araucárias",
      number: "88",
      neighborhood: "Residencial Suíço",
      city: "Campos do Jordão",
      state: "SP",
      zip: "12460-000"
    },
    lot: "Vale Suíço - Quadra B, Lote 05",
    valueTotal: 180000,
    valuePaid: 180000,
    status: "Quitado",
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    name: "Carlos Eduardo Santos",
    cpf: "456.789.123-22",
    rg: "45.678.912-3",
    phone: "(21) 97543-2109",
    email: "carlosedu@hotmail.com",
    address: {
      street: "Travessa das Palmeiras",
      number: "305",
      neighborhood: "Mirante",
      city: "Teresópolis",
      state: "RJ",
      zip: "25953-000"
    },
    lot: "Mirante da Montanha - Quadra C, Lote 22",
    valueTotal: 160000,
    valuePaid: 45000,
    status: "Atrasado",
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const demoTransactions: Transaction[] = [
  {
    date: "2026-06-28",
    description: "Mensalidade Lote 12 - João da Silva Sauro",
    value: 2500,
    type: "Entrada",
    category: "Mensalidade Lotes",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    date: "2026-06-25",
    description: "Quitação Total Lote 05 - Maria de Oliveira",
    value: 65000,
    type: "Entrada",
    category: "Quitação de Lotes",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    date: "2026-06-20",
    description: "Terraplanagem e Abertura de Vias - Alpes Verdes",
    value: 18500,
    type: "Saída",
    category: "Infraestrutura",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    date: "2026-06-15",
    description: "Divulgação e Tráfego Pago - Campanha de Vendas",
    value: 4500,
    type: "Saída",
    category: "Marketing",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    date: "2026-06-10",
    description: "Instalação de Postes de Energia - Vale Suíço",
    value: 12000,
    type: "Saída",
    category: "Infraestrutura",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    date: "2026-06-05",
    description: "Entrada de Sinal Lote 15 - Roberto Carlos",
    value: 15000,
    type: "Entrada",
    category: "Entrada Lotes",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const demoProjects: Project[] = [
  {
    name: "Alpes Verdes Loteamento",
    progress: 85,
    status: "Em andamento",
    soldLots: 42,
    totalLots: 50,
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "Residencial Vale Suíço",
    progress: 100,
    status: "Concluído",
    soldLots: 60,
    totalLots: 60,
    createdAt: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "Mirante da Montanha",
    progress: 15,
    status: "Em planejamento",
    soldLots: 5,
    totalLots: 40,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];
