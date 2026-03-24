import React, { useEffect, useState } from 'react';
import { supabase, ActionPlan, Store, normalizeStatus } from '../lib/supabase';
import { Loader2, TrendingUp, AlertTriangle, CheckCircle, Clock, Download, Activity, X } from 'lucide-react';

type KpiType = 'Total' | 'Pendentes' | 'Em andamento' | 'Concluídos' | 'Atrasados' | null;

export const Dashboard: React.FC = () => {
  const [plans, setPlans] = useState<ActionPlan[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKpi, setSelectedKpi] = useState<KpiType>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: plansData, error: plansError }, { data: storesData, error: storesError }] =
        await Promise.all([
          supabase.from('action_plans').select('*'),
          supabase.from('stores').select('*'),
        ]);

      if (plansError) throw plansError;
      if (storesError) throw storesError;

      const normalizedPlans = (plansData || []).map(plan => ({
        ...plan,
        status: normalizeStatus(plan.status)
      }));
      setPlans(normalizedPlans);
      setStores(storesData || []);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Erro ao carregar dashboard.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  const totalPlans = plans.length;
  const pendingPlans = plans.filter((p) => p.status === 'Pendente').length;
  const inProgressPlans = plans.filter((p) => p.status === 'Em andamento').length;
  const completedPlans = plans.filter((p) => p.status === 'Concluído').length;
  
  const today = new Date();
  const delayedPlans = plans.filter(
    (p) => p.status !== 'Concluído' && p.status !== 'Cancelado' && new Date(p.due_date) < today
  ).length;

  // Plans by store
  const plansByStore = stores.map((store) => {
    const storePlans = plans.filter((p) => p.store_id === store.id);
    return {
      storeName: store.name,
      total: storePlans.length,
      completed: storePlans.filter((p) => p.status === 'Concluído').length,
    };
  }).sort((a, b) => b.total - a.total);

  const exportToCSV = () => {
    const csvRows = [];
    
    // KPIs
    csvRows.push(['Relatório de Dashboard Estratégico']);
    csvRows.push([]);
    csvRows.push(['KPIs']);
    csvRows.push(['Total de Planos', 'Pendentes', 'Em andamento', 'Concluídos', 'Atrasados']);
    csvRows.push([totalPlans, pendingPlans, inProgressPlans, completedPlans, delayedPlans]);
    csvRows.push([]);
    
    // Table
    csvRows.push(['Planos por Loja']);
    csvRows.push(['Loja', 'Total', 'Concluídos', 'Progresso (%)']);
    
    plansByStore.forEach(store => {
      const progress = store.total > 0 ? Math.round((store.completed / store.total) * 100) : 0;
      csvRows.push([`"${store.storeName}"`, store.total, store.completed, `"${progress}%"`]);
    });

    const csvContent = '\uFEFF' + csvRows.map(e => e.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dashboard_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDetailedPlans = () => {
    if (!selectedKpi) return [];
    
    const today = new Date();
    switch (selectedKpi) {
      case 'Pendentes':
        return plans.filter((p) => p.status === 'Pendente');
      case 'Em andamento':
        return plans.filter((p) => p.status === 'Em andamento');
      case 'Concluídos':
        return plans.filter((p) => p.status === 'Concluído');
      case 'Atrasados':
        return plans.filter(
          (p) => p.status !== 'Concluído' && p.status !== 'Cancelado' && new Date(p.due_date) < today
        );
      case 'Total':
        return plans;
      default:
        return [];
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Estratégico</h2>
        <button
          onClick={exportToCSV}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        <div 
          onClick={() => setSelectedKpi(selectedKpi === 'Total' ? null : 'Total')}
          className={`bg-white rounded-2xl p-6 shadow-sm border flex flex-col items-center text-center cursor-pointer transition-all ${selectedKpi === 'Total' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-100 hover:border-blue-300'}`}
        >
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalPlans}</p>
          <p className="text-sm font-medium text-gray-500 mt-1">Total</p>
        </div>

        <div 
          onClick={() => setSelectedKpi(selectedKpi === 'Pendentes' ? null : 'Pendentes')}
          className={`bg-white rounded-2xl p-6 shadow-sm border flex flex-col items-center text-center cursor-pointer transition-all ${selectedKpi === 'Pendentes' ? 'border-yellow-500 ring-2 ring-yellow-200' : 'border-gray-100 hover:border-yellow-300'}`}
        >
          <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{pendingPlans}</p>
          <p className="text-sm font-medium text-gray-500 mt-1">Pendentes</p>
        </div>

        <div 
          onClick={() => setSelectedKpi(selectedKpi === 'Em andamento' ? null : 'Em andamento')}
          className={`bg-white rounded-2xl p-6 shadow-sm border flex flex-col items-center text-center cursor-pointer transition-all ${selectedKpi === 'Em andamento' ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-100 hover:border-purple-300'}`}
        >
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mb-3">
            <Activity className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{inProgressPlans}</p>
          <p className="text-sm font-medium text-gray-500 mt-1">Em andamento</p>
        </div>

        <div 
          onClick={() => setSelectedKpi(selectedKpi === 'Concluídos' ? null : 'Concluídos')}
          className={`bg-white rounded-2xl p-6 shadow-sm border flex flex-col items-center text-center cursor-pointer transition-all ${selectedKpi === 'Concluídos' ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-100 hover:border-green-300'}`}
        >
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{completedPlans}</p>
          <p className="text-sm font-medium text-gray-500 mt-1">Concluídos</p>
        </div>

        <div 
          onClick={() => setSelectedKpi(selectedKpi === 'Atrasados' ? null : 'Atrasados')}
          className={`bg-white rounded-2xl p-6 shadow-sm border flex flex-col items-center text-center cursor-pointer transition-all ${selectedKpi === 'Atrasados' ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-100 hover:border-red-300'}`}
        >
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
            <Clock className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-600">{delayedPlans}</p>
          <p className="text-sm font-medium text-gray-500 mt-1">Atrasados</p>
        </div>
      </div>

      {/* Detalhamento do KPI Selecionado */}
      {selectedKpi && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Detalhamento: Planos {selectedKpi}
            </h3>
            <button 
              onClick={() => setSelectedKpi(null)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Fechar detalhamento"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600">Título</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600">Loja</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600">Prazo</th>
                </tr>
              </thead>
              <tbody>
                {getDetailedPlans().map((plan) => {
                  const store = stores.find(s => s.id === plan.store_id);
                  return (
                    <tr key={plan.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{plan.title}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{store?.name || 'Loja não encontrada'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          plan.status === 'Concluído' ? 'bg-green-100 text-green-800' :
                          plan.status === 'Em andamento' ? 'bg-purple-100 text-purple-800' :
                          plan.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {plan.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(plan.due_date).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  );
                })}
                {getDetailedPlans().length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      Nenhum plano encontrado para este filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts / Tables */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Planos por Loja</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 text-sm font-semibold text-gray-600">Loja</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-600 text-center">Total</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-600 text-center">Concluídos</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-600 text-center">Progresso</th>
              </tr>
            </thead>
            <tbody>
              {plansByStore.map((store, index) => {
                const progress = store.total > 0 ? Math.round((store.completed / store.total) * 100) : 0;
                return (
                  <tr key={index} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{store.storeName}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-center">{store.total}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-center">{store.completed}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 rounded-full" 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium w-8">{progress}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {plansByStore.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    Nenhum dado disponível.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
