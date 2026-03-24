import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, ActionPlan, ActionUpdate, Evidence, ActionPlanStatus, normalizeStatus } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, ArrowLeft, Camera, Upload, MessageSquare, CheckCircle, Clock, XCircle, AlertTriangle, Edit2 } from 'lucide-react';

export const PlanDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [updates, setUpdates] = useState<ActionUpdate[]>([]);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newComment, setNewComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');

  useEffect(() => {
    if (id) {
      fetchPlanDetails();
    }
  }, [id]);

  const fetchPlanDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch plan
      const { data: planData, error: planError } = await supabase
        .from('action_plans')
        .select(`*, store:stores(*)`)
        .eq('id', id)
        .single();

      if (planError) throw planError;
      
      if (planData) {
        planData.status = normalizeStatus(planData.status);
      }
      setPlan(planData);

      // Fetch updates
      const { data: updatesData, error: updatesError } = await supabase
        .from('action_updates')
        .select(`*, user:users(*)`)
        .eq('action_plan_id', id)
        .order('created_at', { ascending: false });

      if (updatesError) throw updatesError;
      setUpdates(updatesData || []);

      // Fetch evidences
      const { data: evidencesData, error: evidencesError } = await supabase
        .from('evidences')
        .select('*')
        .eq('action_plan_id', id)
        .order('created_at', { ascending: false });

      if (evidencesError) throw evidencesError;
      setEvidences(evidencesData || []);
    } catch (err: any) {
      console.error('Error fetching details:', err);
      setError(err.message || 'Erro ao carregar detalhes.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: ActionPlanStatus) => {
    if (!plan || plan.status === newStatus) return;
    
    // Define possible variations for each status to bypass check constraint differences
    const statusVariations: Record<string, string[]> = {
      'Pendente': ['Pendente', 'pendente', 'PENDENTE', 'pending', 'Pending', 'PENDING', 'Aberto', 'aberto', 'ABERTO', 'A Fazer', 'a fazer', 'A FAZER', 'To Do', 'to do', 'TO DO', 'Não Iniciado', 'Não iniciado', 'Nao Iniciado', 'Nao iniciado', 'NÃO INICIADO', 'NAO INICIADO', 'Pendente ', '1', '0'],
      'Em andamento': ['Em andamento', 'Em Andamento', 'em andamento', 'EM ANDAMENTO', 'em_andamento', 'EM_ANDAMENTO', 'in_progress', 'In Progress', 'IN PROGRESS', 'in progress', 'In progress', 'Em_andamento', 'em-andamento', 'Em-andamento', 'Em Execução', 'Em execução', 'em execução', 'EM EXECUÇÃO', 'Em Progresso', 'Em progresso', 'em progresso', 'EM PROGRESSO', 'Fazendo', 'fazendo', 'FAZENDO', 'Em andamento ', '2', '1'],
      'Concluído': ['Concluído', 'Concluido', 'concluído', 'concluido', 'CONCLUÍDO', 'CONCLUIDO', 'completed', 'Completed', 'COMPLETED', 'done', 'Done', 'DONE', 'Fechado', 'fechado', 'FECHADO', 'Feito', 'feito', 'FEITO', 'Concluído ', 'Concluido ', '3', '2'],
      'Cancelado': ['Cancelado', 'cancelado', 'CANCELADO', 'cancelled', 'Cancelled', 'CANCELLED', 'canceled', 'Canceled', 'CANCELED', 'Cancelado ', '4', '3']
    };

    const variationsToTry = statusVariations[newStatus] || [newStatus];
    let success = false;
    let lastError: any = null;
    let successfulVariant = newStatus;

    for (const variant of variationsToTry) {
      try {
        const { error: updateError } = await supabase
          .from('action_plans')
          .update({ status: variant })
          .eq('id', plan.id);

        if (!updateError) {
          success = true;
          successfulVariant = variant as ActionPlanStatus;
          break;
        }
        
        lastError = updateError;
        // If it's not a check constraint violation (23514), stop trying
        if (updateError.code !== '23514') {
          break;
        }
      } catch (err) {
        lastError = err;
        break;
      }
    }

    if (!success) {
      console.error('Error updating status:', lastError);
      alert(`Erro ao atualizar status. O banco de dados rejeitou todas as variações tentadas: ${variationsToTry.join(', ')}. Erro original: ${lastError?.message || 'Erro desconhecido'}`);
      return;
    }

    try {
      // Add history record
      const { error: historyError } = await supabase
        .from('action_updates')
        .insert({
          action_plan_id: plan.id,
          user_id: profile?.id,
          comment: `Status alterado de ${plan.status} para ${newStatus}`,
        });

      if (historyError) {
        console.error('Error inserting history:', historyError);
      }

      // Refresh data
      fetchPlanDetails();
    } catch (err: any) {
      console.error('Error after updating status:', err);
    }
  };

  const handleDateChange = async () => {
    if (!plan || !newDueDate) {
      setIsEditingDate(false);
      return;
    }
    
    try {
      const { error: updateError } = await supabase
        .from('action_plans')
        .update({ due_date: newDueDate })
        .eq('id', plan.id);

      if (updateError) throw updateError;

      // Add history record
      await supabase
        .from('action_updates')
        .insert({
          action_plan_id: plan.id,
          user_id: profile?.id,
          comment: `Data de vencimento alterada para ${format(new Date(newDueDate), 'dd/MM/yyyy')}`,
        });

      fetchPlanDetails();
      setIsEditingDate(false);
    } catch (err: any) {
      console.error('Error updating date:', err);
      alert('Erro ao atualizar data: ' + (err.message || 'Erro desconhecido'));
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !plan) return;

    try {
      const { error } = await supabase
        .from('action_updates')
        .insert({
          action_plan_id: plan.id,
          user_id: profile?.id,
          comment: newComment.trim(),
        });

      if (error) throw error;
      
      setNewComment('');
      fetchPlanDetails();
    } catch (err: any) {
      console.error('Error adding comment:', err);
      alert('Erro ao adicionar comentário.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !plan) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadMessage(null);

    // Simulate progress since standard supabase-js upload doesn't have onProgress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 500);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${plan.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('evidences')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('evidences')
        .getPublicUrl(filePath);

      // Save to database
      const { error: dbError } = await supabase
        .from('evidences')
        .insert({
          action_plan_id: plan.id,
          file_url: publicUrl,
        });

      if (dbError) throw dbError;

      // Add history record
      await supabase
        .from('action_updates')
        .insert({
          action_plan_id: plan.id,
          user_id: profile?.id,
          comment: 'Nova evidência adicionada.',
        });

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadMessage({ type: 'success', text: 'Evidência enviada com sucesso!' });
      fetchPlanDetails();
      
      // Clear success message after 3 seconds
      setTimeout(() => setUploadMessage(null), 3000);
    } catch (err: any) {
      clearInterval(progressInterval);
      console.error('Error uploading file:', err);
      setUploadMessage({ type: 'error', text: 'Erro ao fazer upload da imagem.' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Plano não encontrado.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-blue-600 hover:underline"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Detalhes do Plano</h2>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Loja</p>
            <p className="text-lg font-semibold text-gray-900">{plan.store?.name}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-sm font-medium text-gray-500 mb-1">Vencimento</p>
            {isEditingDate ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button onClick={handleDateChange} className="text-green-600 hover:text-green-700">
                  <CheckCircle className="w-5 h-5" />
                </button>
                <button onClick={() => setIsEditingDate(false)} className="text-gray-400 hover:text-red-600">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center md:justify-end gap-2 group">
                <p className="text-lg font-semibold text-gray-900">
                  {plan.due_date ? format(new Date(plan.due_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                </p>
                <button
                  onClick={() => {
                    setNewDueDate(plan.due_date?.split('T')[0] || '');
                    setIsEditingDate(true);
                  }}
                  className="text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Editar data"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">Problema</h3>
            <p className="text-gray-900 bg-gray-50 p-4 rounded-xl border border-gray-100">
              {plan.description_problem}
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">Plano de Ação</h3>
            <p className="text-gray-900 bg-gray-50 p-4 rounded-xl border border-gray-100">
              {plan.action_plan}
            </p>
          </div>
        </div>
      </div>

      {/* Status Controls */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Status Atual: <span className="font-normal">{plan.status}</span></h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => handleStatusChange('Pendente')}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
              plan.status === 'Pendente'
                ? 'bg-yellow-50 border-yellow-400 text-yellow-700'
                : 'border-gray-100 hover:border-yellow-200 hover:bg-yellow-50 text-gray-600'
            }`}
          >
            <AlertTriangle className={`w-6 h-6 mb-2 ${plan.status === 'Pendente' ? 'text-yellow-500' : ''}`} />
            <span className="text-sm font-medium">Pendente</span>
          </button>
          
          <button
            onClick={() => handleStatusChange('Em andamento')}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
              plan.status === 'Em andamento'
                ? 'bg-blue-50 border-blue-400 text-blue-700'
                : 'border-gray-100 hover:border-blue-200 hover:bg-blue-50 text-gray-600'
            }`}
          >
            <Clock className={`w-6 h-6 mb-2 ${plan.status === 'Em andamento' ? 'text-blue-500' : ''}`} />
            <span className="text-sm font-medium text-center leading-tight">Em andamento</span>
          </button>
          
          <button
            onClick={() => handleStatusChange('Concluído')}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
              plan.status === 'Concluído'
                ? 'bg-green-50 border-green-400 text-green-700'
                : 'border-gray-100 hover:border-green-200 hover:bg-green-50 text-gray-600'
            }`}
          >
            <CheckCircle className={`w-6 h-6 mb-2 ${plan.status === 'Concluído' ? 'text-green-500' : ''}`} />
            <span className="text-sm font-medium">Concluído</span>
          </button>
          
          <button
            onClick={() => handleStatusChange('Cancelado')}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
              plan.status === 'Cancelado'
                ? 'bg-red-50 border-red-400 text-red-700'
                : 'border-gray-100 hover:border-red-200 hover:bg-red-50 text-gray-600'
            }`}
          >
            <XCircle className={`w-6 h-6 mb-2 ${plan.status === 'Cancelado' ? 'text-red-500' : ''}`} />
            <span className="text-sm font-medium">Cancelado</span>
          </button>
        </div>
      </div>

      {/* Evidences */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Evidências</h3>
          
          <div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  <span>Adicionar Foto</span>
                </>
              )}
            </button>
          </div>
        </div>

        {uploading && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Enviando arquivo...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {uploadMessage && (
          <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-2 ${
            uploadMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {uploadMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            {uploadMessage.text}
          </div>
        )}

        {evidences.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {evidences.map((evidence) => (
              <a
                key={evidence.id}
                href={evidence.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square rounded-xl overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity"
              >
                <img
                  src={evidence.file_url}
                  alt="Evidência"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Nenhuma evidência anexada.</p>
          </div>
        )}
      </div>

      {/* History & Comments */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Histórico e Comentários</h3>
        
        <form onSubmit={handleAddComment} className="mb-6 flex gap-3">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Adicionar um comentário..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </form>

        <div className="space-y-4">
          {updates.length > 0 ? (
            updates.map((update) => (
              <div key={update.id} className="flex gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold flex-shrink-0">
                  {update.user?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{update.user?.name || 'Usuário'}</span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(update.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm">{update.comment}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">Nenhum histórico registrado.</p>
          )}
        </div>
      </div>
    </div>
  );
};
