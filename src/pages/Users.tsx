import React, { useEffect, useState } from 'react';
import { supabase, User, Store, Role } from '../lib/supabase';
import { Loader2, Plus, Users as UsersIcon, Shield, Store as StoreIcon, AlertCircle, Trash2, Pencil, ChevronDown, ChevronUp, Search } from 'lucide-react';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [userStoresMap, setUserStoresMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'store' as Role,
    external_unit_id: '',
    storeIds: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Accordion state
  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>({
    admin: true,
    regional: true,
    store: true,
  });

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  const toggleRole = (role: string) => {
    setExpandedRoles(prev => ({ ...prev, [role]: !prev[role] }));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [resetEmailSent, setResetEmailSent] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: usersData, error: usersError }, { data: storesData, error: storesError }, { data: userStoresData, error: userStoresError }] =
        await Promise.all([
          supabase.from('users').select('*').order('name'),
          supabase.from('stores').select('*').order('name'),
          supabase.from('user_stores').select('*'),
        ]);

      if (usersError) throw usersError;
      if (storesError) throw storesError;
      if (userStoresError) throw userStoresError;

      setUsers(usersData || []);
      setStores(storesData || []);
      
      const map: Record<string, string[]> = {};
      userStoresData?.forEach((us) => {
        if (!map[us.user_id]) map[us.user_id] = [];
        map[us.user_id].push(us.store_id);
      });
      setUserStoresMap(map);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (editingUser) {
        // Update existing user
        const { error: userError } = await supabase
          .from('users')
          .update({
            name: newUser.name,
            role: newUser.role,
            external_unit_id: (newUser.role === 'store' || newUser.role === 'regional') ? newUser.external_unit_id : null,
          })
          .eq('id', editingUser.id);

        if (userError) throw userError;

        // Update user_stores if regional
        if (newUser.role === 'regional') {
          // Delete old
          await supabase.from('user_stores').delete().eq('user_id', editingUser.id);
          // Insert new
          if (newUser.storeIds.length > 0) {
            const userStores = newUser.storeIds.map((storeId) => ({
              user_id: editingUser.id,
              store_id: storeId,
            }));
            const { error: linkError } = await supabase.from('user_stores').insert(userStores);
            if (linkError) throw linkError;
          }
        }
      } else {
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
      }

      // Reset form and refresh
      setNewUser({ name: '', email: '', password: '', role: 'store', external_unit_id: '', storeIds: [] });
      setEditingUser(null);
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      console.error('Error saving user:', err);
      if (err.message?.toLowerCase().includes('rate limit')) {
        setError('Limite de criação de usuários excedido (proteção anti-spam do Supabase). Para continuar testando, vá ao painel do Supabase > Authentication > Providers > Email e desative a opção "Confirm email", ou aguarde cerca de 1 hora.');
      } else {
        setError(err.message || 'Erro ao salvar usuário.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!editingUser?.email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(editingUser.email);
      if (error) throw error;
      setResetEmailSent(true);
      setTimeout(() => setResetEmailSent(false), 5000);
    } catch (err: any) {
      console.error('Error sending reset email:', err);
      setError(err.message || 'Erro ao enviar e-mail de redefinição de senha.');
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setNewUser({
      name: user.name,
      email: user.email || '',
      password: '', // Cannot edit password here
      role: user.role,
      external_unit_id: user.external_unit_id || '',
      storeIds: userStoresMap[user.id] || [],
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setNewUser({ name: '', email: '', password: '', role: 'store', external_unit_id: '', storeIds: [] });
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    setError(null);

    try {
      // Note: Deleting from public.users doesn't delete from auth.users automatically
      // unless there's a trigger, but it removes their access to the app.
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userToDelete.id);

      if (deleteError) throw deleteError;

      setUserToDelete(null);
      fetchData();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Erro ao excluir usuário. Verifique se existem planos de ação vinculados a ele.');
      setUserToDelete(null);
    } finally {
      setIsDeleting(false);
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

  const renderUserTable = (roleKey: string, roleUsers: User[], title: string, icon: React.ReactNode) => {
    const isExpanded = expandedRoles[roleKey];
    
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 transition-all duration-200">
        <div 
          className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3 cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => toggleRole(roleKey)}
        >
          <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
            {icon}
          </div>
          <h3 className="text-lg font-bold text-gray-900 flex-1">{title}</h3>
          <span className="bg-gray-200 text-gray-700 py-0.5 px-2.5 rounded-full text-xs font-semibold ml-2">
            {roleUsers.length}
          </span>
          <div className="text-gray-400 ml-2">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
        
        {isExpanded && (
          <div className="overflow-x-auto animate-in fade-in slide-in-from-top-2 duration-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600">Nome</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600">E-mail</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600">Unidade (ID)</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {roleUsers.map((user) => (
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
                    <td className="py-3 px-4 text-sm text-gray-500 font-mono">
                      {user.external_unit_id || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditClick(user); }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar usuário"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setUserToDelete(user); }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir usuário"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {roleUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      Nenhum usuário encontrado nesta categoria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => {
              if (showForm) {
                handleCancelForm();
              } else {
                setShowForm(true);
              }
            }}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">{showForm ? 'Cancelar' : 'Novo Usuário'}</span>
            <span className="sm:hidden">{showForm ? 'Cancelar' : 'Novo'}</span>
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
          <h3 className="text-lg font-bold text-gray-900 mb-4">{editingUser ? 'Editar Usuário' : 'Criar Novo Usuário'}</h3>
          <form onSubmit={handleSubmitUser} className="space-y-4">
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
                  disabled={!!editingUser}
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${editingUser ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
                {editingUser && (
                  <p className="text-xs text-gray-500 mt-1">
                    O e-mail só pode ser alterado pelo próprio usuário em seu perfil.
                  </p>
                )}
              </div>
              {!editingUser && (
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
              )}
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

            <div className="flex justify-between items-center pt-4">
              <div>
                {editingUser && (
                  <button
                    type="button"
                    onClick={handleSendResetEmail}
                    disabled={resetEmailSent}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                  >
                    {resetEmailSent ? 'E-mail Enviado!' : 'Enviar E-mail de Redefinição de Senha'}
                  </button>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancelForm}
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
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingUser ? 'Salvar Alterações' : 'Salvar Usuário')}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="space-y-6">
        {renderUserTable('admin', filteredUsers.filter(u => u.role === 'admin'), 'Administradores', <Shield className="w-5 h-5 text-purple-600" />)}
        {renderUserTable('regional', filteredUsers.filter(u => u.role === 'regional'), 'Regionais', <UsersIcon className="w-5 h-5 text-blue-600" />)}
        {renderUserTable('store', filteredUsers.filter(u => u.role === 'store'), 'Lojas', <StoreIcon className="w-5 h-5 text-green-600" />)}
      </div>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir Usuário</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir o usuário <strong>{userToDelete.name}</strong>? Esta ação removerá o acesso dele ao sistema.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="flex items-center space-x-2 bg-red-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
