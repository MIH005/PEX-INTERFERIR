import React, { useEffect, useState } from 'react';
import { supabase, Store } from '../lib/supabase';
import { Loader2, Plus, Store as StoreIcon, AlertCircle, Trash2, Pencil } from 'lucide-react';

export const Stores: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
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

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('stores')
        .select('*')
        .order('name');

      if (fetchError) throw fetchError;
      setStores(data || []);
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
      const { error: deleteError } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeToDelete.id);

      if (deleteError) throw deleteError;

      setStoreToDelete(null);
      fetchStores();
    } catch (err: any) {
      console.error('Error deleting store:', err);
      setError(err.message || 'Erro ao excluir loja. Verifique se existem usuários ou planos de ação vinculados a ela.');
      setStoreToDelete(null);
    } finally {
      setIsDeleting(false);
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
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Lojas</h2>
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
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Loja</span>
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
                <th className="py-3 px-4 text-sm font-semibold text-gray-600 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
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
              ))}
              {stores.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    Nenhuma loja encontrada.
                  </td>
                </tr>
              )}
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
                Atenção: A exclusão falhará se existirem usuários ou planos de ação vinculados a esta loja.
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
    </div>
  );
};
