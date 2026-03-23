import React, { useEffect, useState } from 'react';
import { supabase, User, Store, Role } from '../lib/supabase';
import { Loader2, Plus, Users as UsersIcon, Shield, Store as StoreIcon, AlertCircle } from 'lucide-react';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'store' as Role,
    external_unit_id: '',
    storeIds: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: usersData, error: usersError }, { data: storesData, error: storesError }] =
        await Promise.all([
          supabase.from('users').select('*').order('name'),
          supabase.from('stores').select('*').order('name'),
        ]);

      if (usersError) throw usersError;
      if (storesError) throw storesError;

      setUsers(usersData || []);
      setStores(storesData || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // 1. Create user in Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
      });

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error('Falha ao criar usuário no Auth.');

      // 2. Insert into users table
      const { error: userError } = await supabase.from('users').insert({
        id: userId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        external_unit_id: (newUser.role === 'store' || newUser.role === 'regional') ? newUser.external_unit_id : null,
      });

      if (userError) throw userError;

      // 3. Link to stores (only for regional)
      if (newUser.role === 'regional' && newUser.storeIds.length > 0) {
        const userStores = newUser.storeIds.map((storeId) => ({
          user_id: userId,
          store_id: storeId,
        }));

        const { error: linkError } = await supabase.from('user_stores').insert(userStores);
        if (linkError) throw linkError;
      }

      // Reset form and refresh
      setNewUser({ name: '', email: '', password: '', role: 'store', external_unit_id: '', storeIds: [] });
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      console.error('Error creating user:', err);
      if (err.message?.toLowerCase().includes('rate limit')) {
        setError('Limite de criação de usuários excedido (proteção anti-spam do Supabase). Para continuar testando, vá ao painel do Supabase > Authentication > Providers > Email e desative a opção "Confirm email", ou aguarde cerca de 1 hora.');
      } else {
        setError(err.message || 'Erro ao criar usuário.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStoreSelection = (storeId: string) => {
    const current = newUser.storeIds;
    if (current.includes(storeId)) {
      setNewUser({ ...newUser, storeIds: current.filter((id) => id !== storeId) });
    } else {
      setNewUser({ ...newUser, storeIds: [...current, storeId] });
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
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Criar Novo Usuário</h3>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha Provisória</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil (Role)</label>
                <select
                  value={newUser.role}
                  onChange={(e) => {
                    const role = e.target.value as Role;
                    setNewUser({ ...newUser, role, storeIds: [] });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="store">Loja (Acesso à própria loja)</option>
                  <option value="regional">Regional (Acesso a múltiplas lojas)</option>
                  <option value="admin">Admin (Acesso total)</option>
                </select>
              </div>
            </div>

            {newUser.role === 'store' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loja Vinculada (ID Externo)
                </label>
                <select
                  required
                  value={newUser.external_unit_id}
                  onChange={(e) => setNewUser({ ...newUser, external_unit_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">Selecione a loja...</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.external_unit_id || store.id}>
                      {store.name} {store.external_unit_id ? `(ID: ${store.external_unit_id})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {newUser.role === 'regional' && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Externo do Regional (Integração)
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.external_unit_id}
                    onChange={(e) => setNewUser({ ...newUser, external_unit_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: REG-01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lojas Vinculadas (Selecione múltiplas)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-xl bg-gray-50">
                    {stores.map((store) => (
                      <label
                        key={store.id}
                        className={`flex items-center p-2 rounded-lg border cursor-pointer transition-colors ${
                          newUser.storeIds.includes(store.id)
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          name="storeSelection"
                          checked={newUser.storeIds.includes(store.id)}
                          onChange={() => handleStoreSelection(store.id)}
                          className="hidden"
                        />
                        <span className="text-sm font-medium truncate">{store.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={
                  submitting || 
                  (newUser.role === 'regional' && (newUser.storeIds.length === 0 || !newUser.external_unit_id)) ||
                  (newUser.role === 'store' && !newUser.external_unit_id)
                }
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Usuário'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4 text-sm font-semibold text-gray-600">Nome</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-600">E-mail</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-600">Perfil</th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-600">Unidade (ID)</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold flex-shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {user.email || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                      user.role === 'regional' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      'bg-gray-100 text-gray-800 border-gray-200'
                    }`}>
                      {user.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                      {user.role === 'regional' && <UsersIcon className="w-3 h-3 mr-1" />}
                      {user.role === 'store' && <StoreIcon className="w-3 h-3 mr-1" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500 font-mono">
                    {user.external_unit_id || '-'}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    Nenhum usuário encontrado.
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
