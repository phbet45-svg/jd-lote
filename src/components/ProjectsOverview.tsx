import React, { useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { Project } from '../types';
import { LayoutGrid, CheckCircle, Plus, Tag, Loader2, Edit2 } from 'lucide-react';

interface ProjectsOverviewProps {
  projects: Project[];
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export default function ProjectsOverview({ projects, onSuccess, onError }: ProjectsOverviewProps) {
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    progress: '0',
    status: 'Em andamento' as 'Em andamento' | 'Concluído' | 'Em planejamento',
    soldLots: '0',
    totalLots: '10'
  });

  const [editFormData, setEditFormData] = useState({
    progress: '0',
    soldLots: '0',
    status: 'Em andamento' as 'Em andamento' | 'Concluído' | 'Em planejamento'
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.totalLots) {
      onError('Por favor, preencha o nome do loteamento.');
      return;
    }

    setLoading(true);
    try {
      const proj: Project = {
        name: formData.name,
        progress: Math.min(Math.max(parseInt(formData.progress) || 0, 0), 100),
        status: formData.status,
        soldLots: parseInt(formData.soldLots) || 0,
        totalLots: parseInt(formData.totalLots) || 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'projects'), proj);
      onSuccess(`Loteamento "${formData.name}" adicionado com sucesso!`);
      
      // Reset
      setFormData({
        name: '',
        progress: '0',
        status: 'Em andamento',
        soldLots: '0',
        totalLots: '10'
      });
      setShowAddForm(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'projects');
      onError('Erro ao adicionar loteamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject?.id) return;

    setLoading(true);
    try {
      const projRef = doc(db, 'projects', editingProject.id);
      await updateDoc(projRef, {
        progress: Math.min(Math.max(parseInt(editFormData.progress) || 0, 0), 100),
        soldLots: parseInt(editFormData.soldLots) || 0,
        status: editFormData.status,
        updatedAt: new Date().toISOString()
      });

      onSuccess(`Loteamento "${editingProject.name}" atualizado com sucesso!`);
      setEditingProject(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `projects/${editingProject.id}`);
      onError('Erro ao atualizar loteamento.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído':
        return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
      case 'Em andamento':
        return 'bg-amber-50 text-amber-800 border border-amber-200';
      case 'Em planejamento':
        return 'bg-blue-50 text-blue-800 border border-blue-200';
      default:
        return 'bg-gray-50 text-gray-800 border border-gray-200';
    }
  };

  return (
    <div className="space-y-6" id="projects-overview-panel">
      
      <div className="flex items-center justify-between border-b border-[#2d3a31] pb-4">
        <div className="flex items-center gap-3">
          <LayoutGrid className="w-6 h-6 text-amber-400" />
          <div>
            <h2 className="text-xl font-bold text-[#F5F2EB]">Projetos & Loteamentos</h2>
            <p className="text-xs text-gray-400 font-medium">Controle de progresso físico, lotes vendidos e status</p>
          </div>
        </div>

        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingProject(null);
          }}
          className="flex items-center gap-2 bg-[#121c15] border border-amber-400/40 hover:border-amber-400 text-amber-400 font-semibold text-xs px-4 py-2 rounded-xl cursor-pointer transition active:scale-[0.98]"
          id="toggle-add-project-btn"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Fechar Formulário' : 'Novo Loteamento'}</span>
        </button>
      </div>

      {/* Adicionar Novo Loteamento */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="bg-[#121c15] border border-[#2d3a31] rounded-2xl p-5 shadow-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 animate-slide-in" id="add-project-form">
          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <label className="text-xs text-gray-300 font-medium">Nome do Loteamento *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Residencial Alpes Suíços"
              className="bg-[#0b120d] border border-[#2d3a31] rounded-xl px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-amber-400 transition"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-300 font-medium">Progresso Obra (%)</label>
            <input
              type="number"
              value={formData.progress}
              onChange={e => setFormData(prev => ({ ...prev, progress: e.target.value }))}
              min="0"
              max="100"
              className="bg-[#0b120d] border border-[#2d3a31] rounded-xl px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-amber-400 transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-300 font-medium">Lotes Vendidos / Total</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={formData.soldLots}
                onChange={e => setFormData(prev => ({ ...prev, soldLots: e.target.value }))}
                placeholder="Vendidos"
                min="0"
                className="w-1/2 bg-[#0b120d] border border-[#2d3a31] rounded-xl px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-amber-400 transition"
              />
              <input
                type="number"
                value={formData.totalLots}
                onChange={e => setFormData(prev => ({ ...prev, totalLots: e.target.value }))}
                placeholder="Total"
                min="1"
                className="w-1/2 bg-[#0b120d] border border-[#2d3a31] rounded-xl px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 lg:col-span-1 justify-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[38px] flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 text-black font-semibold text-xs rounded-xl cursor-pointer transition shadow-lg shadow-amber-500/10"
              id="submit-new-project-btn"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Loteamento'}
            </button>
          </div>
        </form>
      )}

      {/* Editar Loteamento */}
      {editingProject && (
        <form onSubmit={handleEditSubmit} className="bg-[#1c2720] border border-amber-400/40 rounded-2xl p-5 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-4 animate-slide-in" id="edit-project-form">
          <div className="md:col-span-4 border-b border-[#2d3a31] pb-2 flex justify-between">
            <h3 className="text-sm font-bold text-amber-400">Atualizar Obra: {editingProject.name}</h3>
            <button type="button" onClick={() => setEditingProject(null)} className="text-xs text-gray-400 hover:text-white cursor-pointer">Cancelar</button>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-300 font-medium">Progresso Obra (%)</label>
            <input
              type="number"
              value={editFormData.progress}
              onChange={e => setEditFormData(prev => ({ ...prev, progress: e.target.value }))}
              min="0"
              max="100"
              className="bg-[#0b120d] border border-[#2d3a31] rounded-xl px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-amber-400 transition"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-300 font-medium">Lotes Vendidos</label>
            <input
              type="number"
              value={editFormData.soldLots}
              onChange={e => setEditFormData(prev => ({ ...prev, soldLots: e.target.value }))}
              min="0"
              max={editingProject.totalLots}
              className="bg-[#0b120d] border border-[#2d3a31] rounded-xl px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-amber-400 transition"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-300 font-medium">Status do Projeto</label>
            <select
              value={editFormData.status}
              onChange={e => setEditFormData(prev => ({ ...prev, status: e.target.value as any }))}
              className="bg-[#0b120d] border border-[#2d3a31] rounded-xl px-3 py-2 text-sm text-[#F5F2EB] focus:outline-none focus:border-amber-400 transition h-[38px]"
            >
              <option value="Em planejamento">Em planejamento</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Concluído">Concluído</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5 justify-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[38px] flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs rounded-xl cursor-pointer transition shadow-lg"
              id="submit-edit-project-btn"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      )}

      {/* Grid de Cards de Projetos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="projects-grid">
        {projects.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400">
            Nenhum projeto ou loteamento cadastrado.
          </div>
        ) : (
          projects.map((proj, idx) => (
            <div
              key={proj.id || idx}
              className="bg-[#121c15] border border-[#2d3a31] rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-[#3a4e3f] transition duration-300"
              id={`project-card-${proj.id || idx}`}
            >
              {/* Highlight bar inside card */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-700 to-amber-500" />
              
              <div className="flex justify-between items-start mb-4">
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${getStatusColor(proj.status)}`}>
                  {proj.status}
                </span>
                
                <button
                  onClick={() => {
                    setEditingProject(proj);
                    setEditFormData({
                      progress: String(proj.progress),
                      soldLots: String(proj.soldLots),
                      status: proj.status
                    });
                    setShowAddForm(false);
                  }}
                  className="p-1 text-gray-400 hover:text-amber-400 transition cursor-pointer"
                  title="Editar Loteamento"
                  aria-label={`Editar loteamento ${proj.name}`}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-lg font-bold text-[#F5F2EB] group-hover:text-amber-300 transition duration-150">
                {proj.name}
              </h3>

              {/* Progress Circle Visual */}
              <div className="my-6 space-y-2">
                <div className="flex justify-between text-xs text-gray-300">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                    Progresso da Obra
                  </span>
                  <span className="font-mono font-bold text-amber-400">{proj.progress}%</span>
                </div>
                
                {/* Horizontal Progress Bar */}
                <div className="w-full bg-[#0b120d] h-3 rounded-full overflow-hidden p-[2px] border border-[#2d3a31]/60">
                  <div
                    className="bg-gradient-to-r from-emerald-600 to-amber-400 h-full rounded-full transition-all duration-700"
                    style={{ width: `${proj.progress}%` }}
                  />
                </div>
              </div>

              {/* Bottom stats: Sold lots vs Total */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#2d3a31]/50 text-xs">
                <div>
                  <span className="text-gray-400 block uppercase text-[9px] tracking-wider font-semibold">Lotes Vendidos</span>
                  <span className="text-md font-bold text-[#F5F2EB] font-mono mt-0.5 block">
                    {proj.soldLots} <span className="text-gray-500 font-normal">/ {proj.totalLots}</span>
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block uppercase text-[9px] tracking-wider font-semibold">Disponíveis</span>
                  <span className="text-md font-bold text-emerald-400 font-mono mt-0.5 block">
                    {Math.max(proj.totalLots - proj.soldLots, 0)} <span className="text-gray-500 text-xs font-normal">lotes</span>
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
