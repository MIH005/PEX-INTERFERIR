import React, { useEffect, useState } from 'react';
import { supabase, Store } from '../lib/supabase';
import { Loader2, Plus, Store as StoreIcon, AlertCircle, Trash2, Pencil, UserPlus, CheckCircle2, Search } from 'lucide-react';

export const Stores: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [storeUsers, setStoreUsers] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [newStore, setNewStore] = useState({
    name: '',
    external_unit_id: '',
    city: '',
    email: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Create User state
  const [storeToCreateUser, setStoreToCreateUser] = useState<Store | null>(null);
  const [newUserPassword, setNewUserPassword] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Search state
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: storesData, error: fetchError }, { data: usersData, error: usersError }] = await Promise.all([
        supabase.from('stores').select('*').order('name'),
        supabase.from('users').select('external_unit_id').eq('role', 'store')
      ]);

      if (fetchError) throw fetchError;
      if (usersError) throw usersError;

      setStores(storesData || []);
      
      const userMap: Record<string, boolean> = {};
      usersData?.forEach(u => {
        if (u.external_unit_id) userMap[u.external_unit_id] = true;
      });
      setStoreUsers(userMap);
    } catch (err: any) {
      console.error('Error fetching stores:', err);
      setError(err.message || 'Erro ao carregar lojas.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (editingStore) {
        const { error: updateError } = await supabase
          .from('stores')
          .update({
            name: newStore.name,
            external_unit_id: newStore.external_unit_id || null,
            city: newStore.city,
            email: newStore.email,
          })
          .eq('id', editingStore.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('stores').insert({
          name: newStore.name,
          external_unit_id: newStore.external_unit_id || null,
          city: newStore.city,
          email: newStore.email,
        });

        if (insertError) throw insertError;
      }

      setNewStore({ name: '', external_unit_id: '', city: '', email: '' });
      setEditingStore(null);
      setShowForm(false);
      fetchStores();
    } catch (err: any) {
      console.error('Error saving store:', err);
      setError(err.message || 'Erro ao salvar loja.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (store: Store) => {
    setEditingStore(store);
    setNewStore({
      name: store.name,
      external_unit_id: store.external_unit_id || '',
      city: store.city,
      email: store.email || '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingStore(null);
    setNewStore({ name: '', external_unit_id: '', city: '', email: '' });
  };

  const handleDeleteStore = async () => {
    if (!storeToDelete) return;
    setIsDeleting(true);
    setError(null);

    try {
      // First, delete related user_stores
      const { error: userStoresError } = await supabase
        .from('user_stores')
        .delete()
        .eq('store_id', storeToDelete.id);

      if (userStoresError) throw userStoresError;

      // Second, delete related action_plans
      const { error: actionPlansError } = await supabase
        .from('action_plans')
        .delete()
        .eq('store_id', storeToDelete.id);

      if (actionPlansError) throw actionPlansError;

      // Finally, delete the store
      const { error: deleteError } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeToDelete.id);

      if (deleteError) throw deleteError;

      setStoreToDelete(null);
      fetchStores();
    } catch (err: any) {
      console.error('Error deleting store:', err);
      setError(err.message || 'Erro ao excluir loja.');
      setStoreToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateStoreUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeToCreateUser) return;
    
    setIsCreatingUser(true);
    setError(null);

    try {
      // 1. Create user in Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: storeToCreateUser.email || '',
        password: newUserPassword,
      });

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error('Falha ao criar usuário no Auth.');

      // 2. Insert into users table
      const { error: userError } = await supabase.from('users').insert({
        id: userId,
        name: storeToCreateUser.name,
        email: storeToCreateUser.email,
        role: 'store',
        external_unit_id: storeToCreateUser.external_unit_id,
      });

      if (userError) throw userError;

      setStoreToCreateUser(null);
      setNewUserPassword('');
      fetchStores();
    } catch (err: any) {
      console.error('Error creating store user:', err);
      if (err.message?.toLowerCase().includes('rate limit')) {
        setError('Limite de criação de usuários excedido (proteção anti-spam do Supabase). Aguarde alguns instantes ou desative a confirmação de e-mail no painel do Supabase.');
      } else {
        setError(err.message || 'Erro ao criar usuário para a loja.');
      }
    } finally {
      setIsCreatingUser(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const filteredStores = stores.filter(store => {
    const searchLower = search.toLowerCase();
    return (
      store.name.toLowerCase().includes(searchLower) ||
      (store.external_unit_id && store.external_unit_id.toLowerCase().includes(searchLower)) ||
      (store.city && store.city.toLowerCase().includes(searchLower)) ||
      (store.email && store.email.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Lojas</h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar loja..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full sm:w-64 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => {
              if (showForm) {
                handleCancelForm();
              } else {
                setNewStore({ name: '', external_unit_id: '', city: '', email: '' });
                setEditingStore(null);
                setShowForm(true);
              }
            }}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span>Nova Loja</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {editingStore ? 'Editar Loja' : 'Cadastrar Nova Loja'}
          </h3>
          <form onSubmit={handleSubmitStore} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Loja</label>
                <input
                  type="text"
                  required
                  value={newStore.name}
                  onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Externo (Integração)</label>
                <input
                  type="text"
                  required
                  value={newStore.external_unit_id}
                  onChange={(e) => setNewStore({ ...newStore, external_unit_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: 4587"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                <input
                  type="text"
                  required
                  value={newStore.city}
                  onChange={(e) => setNewStore({ ...newStore, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail da Loja</label>
                <input
                  type="email"
                  required
                  value={newStore.email}
                  onChange={(e) => setNewStore({ ...newStore, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || !newStore.external_unit_id}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingStore ? 'Salvar Alterações' : 'Salvar Loja')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stores List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4 text-sm font-semibold text-gray-600">Nome</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-600">ID Externo</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-600">Cidade</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-600">E-mail</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-600">Acesso</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-600 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredStores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    Nenhuma loja encontrada.
                  </td>
                </tr>
              ) : (
                filteredStores.map((store) => (
                  <tr key={store.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold flex-shrink-0">
                        <StoreIcon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{store.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500 font-mono">
                    {store.external_unit_id || '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {store.city}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {store.email}
                  </td>
                  <td className="py-3 px-4">
                    {store.external_unit_id && storeUsers[store.external_unit_id] ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Possui Acesso
                      </span>
                    ) : (
                      <button
                        onClick={() => setStoreToCreateUser(store)}
                        disabled={!store.email || !store.external_unit_id}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!store.email ? "Loja precisa ter e-mail cadastrado" : !store.external_unit_id ? "Loja precisa ter ID Externo" : "Criar usuário para esta loja"}
                      >
                        <UserPlus className="w-3 h-3 mr-1" />
                        Criar Acesso
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditClick(store)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar loja"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setStoreToDelete(store)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir loja"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {storeToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir Loja</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir a loja <strong>{storeToDelete.name}</strong>? Esta ação não pode ser desfeita.
              <br /><br />
              <span className="text-sm text-red-600 font-medium">
                Atenção: Todos os planos de ação e vínculos de usuários com esta loja também serão excluídos.
              </span>
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setStoreToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteStore}
                disabled={isDeleting}
                className="flex items-center space-x-2 bg-red-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {storeToCreateUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Criar Acesso para Loja</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Isso criará um usuário para a loja <strong>{storeToCreateUser.name}</strong> com o e-mail <strong>{storeToCreateUser.email}</strong>.
            </p>
            <form onSubmit={handleCreateStoreUser}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha Provisória</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStoreToCreateUser(null);
                    setNewUserPassword('');
                  }}
                  disabled={isCreatingUser}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser || newUserPassword.length < 6}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isCreatingUser ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                  <span>{isCreatingUser ? 'Criando...' : 'Criar Acesso'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
