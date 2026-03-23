import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, ActionPlan, Store, normalizeStatus } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Filter, Loader2, Calendar, MapPin, AlertCircle } from 'lucide-react';

export const Home: React.FC = () => {
  const { profile } = useAuth();
  const [plans, setPlans] = useState<ActionPlan[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch stores for filter dropdown
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*');
      
      if (storesError) throw storesError;
      setStores(storesData || []);

      // Fetch action plans
      const { data: plansData, error: plansError } = await supabase
        .from('action_plans')
        .select(`
          *,
          store:stores(*)
        `)
        .order('created_at', { ascending: false });

      if (plansError) throw plansError;
      
      const normalizedPlans = (plansData || []).map(plan => ({
        ...plan,
        status: normalizeStatus(plan.status)
      }));
      setPlans(normalizedPlans);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Erro ao carregar os dados.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPlans = plans.filter((plan) => {
    const matchStatus = statusFilter === 'all' || plan.status === statusFilter;
    const matchStore = storeFilter === 'all' || plan.store_id === storeFilter;
    const matchSearch =
      plan.description_problem.toLowerCase().includes(search.toLowerCase()) ||
      plan.action_plan.toLowerCase().includes(search.toLowerCase()) ||
      plan.store?.name.toLowerCase().includes(search.toLowerCase());

    return matchStatus && matchStore && matchSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Em andamento':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Concluído':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Planos de Ação</h2>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full sm:w-64 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="all">Todos os Status</option>
            <option value="Pendente">Pendente</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Concluído">Concluído</option>
            <option value="Cancelado">Cancelado</option>
          </select>

          {profile?.role !== 'store' && (
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="all">Todas as Lojas</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {/* List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPlans.length === 0 && !loading && !error && (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-lg">Nenhum plano de ação encontrado.</p>
          </div>
        )}
        
        {filteredPlans.map((plan) => (
          <Link
            key={plan.id}
            to={`/plan/${plan.id}`}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col h-full"
          >
            <div className="flex justify-between items-start mb-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                  plan.status
                )}`}
              >
                {plan.status}
              </span>
              <div className="flex items-center text-gray-500 text-sm">
                <Calendar className="w-4 h-4 mr-1" />
                {plan.due_date ? format(new Date(plan.due_date), 'dd/MM/yyyy', { locale: ptBR }) : 'Sem data'}
              </div>
            </div>
            
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
              {plan.description_problem}
            </h3>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
              {plan.action_plan}
            </p>
            
            <div className="mt-auto pt-4 border-t border-gray-50 flex items-center text-sm text-gray-500">
              <MapPin className="w-4 h-4 mr-1 text-gray-400" />
              <span className="truncate">{plan.store?.name || 'Loja não encontrada'}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
