import React, { useEffect, useState } from 'react';
import { supabase, ActionPlan, Store, normalizeStatus } from '../lib/supabase';
import { Loader2, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [plans, setPlans] = useState<ActionPlan[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Estratégico</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalPlans}</p>
          <p className="text-sm font-medium text-gray-500 mt-1">Total de Planos</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{pendingPlans}</p>
          <p className="text-sm font-medium text-gray-500 mt-1">Pendentes</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{completedPlans}</p>
          <p className="text-sm font-medium text-gray-500 mt-1">Concluídos</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
            <Clock className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-600">{delayedPlans}</p>
          <p className="text-sm font-medium text-gray-500 mt-1">Atrasados</p>
        </div>
      </div>

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
