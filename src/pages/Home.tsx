import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase, ActionPlan, Store, normalizeStatus, User } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Filter, Loader2, Calendar, MapPin, AlertCircle, ChevronDown, ChevronRight, Users, ClipboardList } from 'lucide-react';

export const Home: React.FC = () => {
  const { profile } = useAuth();
  const [plans, setPlans] = useState<ActionPlan[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [regionals, setRegionals] = useState<User[]>([]);
  const [userStores, setUserStores] = useState<{ user_id: string; store_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  
  // Advanced Filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [createdDateStart, setCreatedDateStart] = useState<string>('');
  const [createdDateEnd, setCreatedDateEnd] = useState<string>('');
  const [dueDateStart, setDueDateStart] = useState<string>('');
  const [dueDateEnd, setDueDateEnd] = useState<string>('');

  // Drill-down state
  const [selectedRegionalId, setSelectedRegionalId] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

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

      if (profile?.role === 'admin') {
        const [{ data: regionalsData }, { data: userStoresData }] = await Promise.all([
          supabase.from('users').select('*').eq('role', 'regional'),
          supabase.from('user_stores').select('*')
        ]);
        setRegionals(regionalsData || []);
        setUserStores(userStoresData || []);
      }
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

    let matchCreatedDate = true;
    if (createdDateStart || createdDateEnd) {
      const planCreatedDate = plan.created_at ? new Date(plan.created_at).getTime() : 0;
      if (createdDateStart) {
        const startDate = new Date(createdDateStart).getTime();
        if (planCreatedDate < startDate) matchCreatedDate = false;
      }
      if (createdDateEnd) {
        const endDate = new Date(createdDateEnd);
        endDate.setHours(23, 59, 59, 999);
        if (planCreatedDate > endDate.getTime()) matchCreatedDate = false;
      }
    }

    let matchDueDate = true;
    if (dueDateStart || dueDateEnd) {
      const planDueDate = plan.due_date ? new Date(plan.due_date).getTime() : 0;
      if (!plan.due_date) {
        matchDueDate = false;
      } else {
        if (dueDateStart) {
          const startDate = new Date(dueDateStart).getTime();
          if (planDueDate < startDate) matchDueDate = false;
        }
        if (dueDateEnd) {
          const endDate = new Date(dueDateEnd);
          endDate.setHours(23, 59, 59, 999);
          if (planDueDate > endDate.getTime()) matchDueDate = false;
        }
      }
    }

    return matchStatus && matchStore && matchSearch && matchCreatedDate && matchDueDate;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'A iniciar':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Concluído':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const groupedData = useMemo(() => {
    if (profile?.role !== 'admin') return [];

    const storeToRegionalMap: Record<string, string[]> = {};
    userStores.forEach(us => {
      if (!storeToRegionalMap[us.store_id]) storeToRegionalMap[us.store_id] = [];
      storeToRegionalMap[us.store_id].push(us.user_id);
    });

    const plansByStore: Record<string, ActionPlan[]> = {};
    filteredPlans.forEach(plan => {
      if (!plansByStore[plan.store_id]) plansByStore[plan.store_id] = [];
      plansByStore[plan.store_id].push(plan);
    });

    const regionalsMap = new Map<string, User>();
    regionals.forEach(r => regionalsMap.set(r.id, r));

    const regionalGroups: Record<string, { store: Store; plans: ActionPlan[] }[]> = {};
    const noRegionalStores: { store: Store; plans: ActionPlan[] }[] = [];

    const hasPlanFilters = statusFilter !== 'all' || createdDateStart !== '' || createdDateEnd !== '' || dueDateStart !== '' || dueDateEnd !== '';

    stores.forEach(store => {
      const storePlans = plansByStore[store.id] || [];
      
      const matchStoreFilter = storeFilter === 'all' || store.id === storeFilter;
      const matchSearch = search === '' || store.name.toLowerCase().includes(search.toLowerCase());
      
      const shouldShowStore = storePlans.length > 0 || (!hasPlanFilters && matchStoreFilter && matchSearch);

      if (!shouldShowStore) return;

      const regionalIds = storeToRegionalMap[store.id];
      if (regionalIds && regionalIds.length > 0) {
        regionalIds.forEach(rId => {
          if (!regionalGroups[rId]) regionalGroups[rId] = [];
          regionalGroups[rId].push({ store, plans: storePlans });
        });
      } else {
        noRegionalStores.push({ store, plans: storePlans });
      }
    });

    const grouped = Object.entries(regionalGroups).map(([rId, storeGroups]) => ({
      regional: regionalsMap.get(rId) || { id: rId, name: 'Regional Desconhecido', role: 'regional' } as User,
      stores: storeGroups
    }));

    grouped.sort((a, b) => (a.regional?.name || '').localeCompare(b.regional?.name || ''));

    if (noRegionalStores.length > 0) {
      grouped.push({
        regional: null,
        stores: noRegionalStores
      });
    }

    return grouped;
  }, [profile?.role, filteredPlans, stores, regionals, userStores, search, statusFilter, storeFilter, createdDateStart, createdDateEnd, dueDateStart, dueDateEnd]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Planos de Ação</h2>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[140px]"
              >
                <option value="all">Todos os Status</option>
                <option value="A iniciar">A iniciar</option>
                <option value="Concluído">Concluído</option>
                <option value="Cancelado">Cancelado</option>
              </select>

              {profile?.role !== 'store' && (
                <select
                  value={storeFilter}
                  onChange={(e) => setStoreFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[140px]"
                >
                  <option value="all">Todas as Lojas</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-4 py-2 border rounded-xl flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${showAdvancedFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filtros</span>
              </button>
            </div>
          </div>

          {showAdvancedFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Criado a partir de</label>
                <input
                  type="date"
                  value={createdDateStart}
                  onChange={(e) => setCreatedDateStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Criado até</label>
                <input
                  type="date"
                  value={createdDateEnd}
                  onChange={(e) => setCreatedDateEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Data prevista de conclusão a partir de</label>
                <input
                  type="date"
                  value={dueDateStart}
                  onChange={(e) => setDueDateStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Data prevista de conclusão até</label>
                <input
                  type="date"
                  value={dueDateEnd}
                  onChange={(e) => setDueDateEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="col-span-full flex justify-end">
                <button
                  onClick={() => {
                    setCreatedDateStart('');
                    setCreatedDateEnd('');
                    setDueDateStart('');
                    setDueDateEnd('');
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Limpar datas
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {/* Breadcrumb for Admin Drill-down */}
      {profile?.role === 'admin' && (selectedRegionalId || selectedStoreId) && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <button 
            onClick={() => { setSelectedRegionalId(null); setSelectedStoreId(null); }} 
            className="hover:text-blue-600 font-medium transition-colors"
          >
            Regionais
          </button>
          
          {selectedRegionalId && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <button 
                onClick={() => setSelectedStoreId(null)} 
                className={`hover:text-blue-600 transition-colors ${!selectedStoreId ? 'text-gray-900 font-semibold' : 'font-medium'}`}
              >
                {groupedData.find(g => (g.regional?.id || 'sem-regional') === selectedRegionalId)?.regional?.name || 'Lojas sem Regional'}
              </button>
            </>
          )}
          
          {selectedStoreId && selectedRegionalId && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900 font-semibold">
                {groupedData.find(g => (g.regional?.id || 'sem-regional') === selectedRegionalId)?.stores.find(s => s.store.id === selectedStoreId)?.store.name}
              </span>
            </>
          )}
        </div>
      )}

      {/* List */}
      {profile?.role === 'admin' ? (
        <div className="space-y-4">
          {groupedData.length === 0 && !loading && !error && (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <ClipboardList className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Nenhum plano de ação encontrado</h3>
              <p className="text-gray-500 max-w-sm">
                Não há planos de ação que correspondam aos filtros atuais ou você ainda não possui planos cadastrados.
              </p>
            </div>
          )}

          {!selectedRegionalId && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groupedData.map((group) => {
                const regionalId = group.regional?.id || 'sem-regional';
                const regionalName = group.regional?.name || 'Lojas sem Regional';
                const totalPlans = group.stores.reduce((acc, s) => acc + s.plans.length, 0);

                return (
                  <button
                    key={regionalId}
                    onClick={() => setSelectedRegionalId(regionalId)}
                    className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-left flex flex-col items-start group"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-100 transition-colors">
                      <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{regionalName}</h3>
                    <div className="flex items-center text-sm text-gray-500 gap-3 mt-auto pt-2">
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {group.stores.length} lojas</span>
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {totalPlans} planos</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selectedRegionalId && !selectedStoreId && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groupedData.find(g => (g.regional?.id || 'sem-regional') === selectedRegionalId)?.stores.map((storeGroup) => (
                <button
                  key={storeGroup.store.id}
                  onClick={() => setSelectedStoreId(storeGroup.store.id)}
                  className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-green-300 transition-all text-left flex flex-col items-start group"
                >
                  <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600 mb-4 group-hover:bg-green-100 transition-colors">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{storeGroup.store.name}</h3>
                  <div className="flex items-center text-sm text-gray-500 gap-3 mt-auto pt-2">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {storeGroup.plans.length} planos</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedRegionalId && selectedStoreId && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(() => {
                const regionalGroup = groupedData.find(g => (g.regional?.id || 'sem-regional') === selectedRegionalId);
                const storeGroup = regionalGroup?.stores.find(s => s.store.id === selectedStoreId);
                const plans = storeGroup?.plans || [];

                if (plans.length === 0) {
                  return (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <ClipboardList className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Nenhum plano de ação</h3>
                      <p className="text-gray-500 max-w-sm">
                        Esta loja ainda não possui nenhum plano de ação cadastrado.
                      </p>
                    </div>
                  );
                }

                return plans.map((plan) => (
                  <Link
                    key={plan.id}
                    to={`/plan/${plan.id}`}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-300 transition-all flex flex-col h-full"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-wrap gap-2 items-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                            plan.status
                          )}`}
                        >
                          {plan.status}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-indigo-50 text-indigo-700 border-indigo-200">
                          {plan.checklist_type || 'Agenda do Líder'}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-500 text-sm whitespace-nowrap ml-2">
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
                  </Link>
                ));
              })()}
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlans.length === 0 && !loading && !error && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <ClipboardList className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Nenhum plano de ação encontrado</h3>
              <p className="text-gray-500 max-w-sm">
                Não há planos de ação que correspondam aos filtros atuais ou você ainda não possui planos cadastrados.
              </p>
            </div>
          )}
          
          {filteredPlans.map((plan) => (
            <Link
              key={plan.id}
              to={`/plan/${plan.id}`}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-wrap gap-2 items-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                      plan.status
                    )}`}
                  >
                    {plan.status}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-indigo-50 text-indigo-700 border-indigo-200">
                    {plan.checklist_type || 'Agenda do Líder'}
                  </span>
                </div>
                <div className="flex items-center text-gray-500 text-sm whitespace-nowrap ml-2">
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
      )}
    </div>
  );
};
