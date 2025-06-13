
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import Layout from './Layout';
import QRCodeGenerator from './QRCodeGenerator';
import { MobileLayout } from './MobileLayout';
import { ResponsiveGrid } from './ResponsiveGrid';
import { MobileOptimizedCard } from './MobileOptimizedCard';
import { TouchFriendlyButton } from './TouchFriendlyButton';
import { ResponsiveText } from './ResponsiveText';
import { useMobile } from '../hooks/use-mobile';
import { 
  Search, 
  Filter, 
  Edit3, 
  QrCode, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Wrench,
  Eye,
  X,
  Trash2,
  Save
} from 'lucide-react';

const Inventario: React.FC = () => {
  const { chromebooks, updateChromebookStatus, updateChromebook, deleteChromebook } = useApp();
  const { isMobile } = useMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showQRCode, setShowQRCode] = useState<string | null>(null);
  const [editingChromebook, setEditingChromebook] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chromebookToDelete, setChromebookToDelete] = useState<any>(null);

  // Form state for editing
  const [editForm, setEditForm] = useState({
    patrimonio: '',
    modelo: '',
    serie: '',
    anoFabricacao: '',
    status: 'disponivel' as const,
    equipamentoProvisorizado: false,
    observacoes: '',
  });

  const filteredChromebooks = chromebooks.filter(chromebook => {
    const matchesSearch = 
      chromebook.patrimonio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chromebook.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chromebook.serie.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || chromebook.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'disponivel':
        return { color: 'text-green-600 bg-green-50', icon: CheckCircle, label: 'Disponível' };
      case 'emprestado':
        return { color: 'text-purple-600 bg-purple-50', icon: AlertCircle, label: 'Emprestado' };
      case 'manutencao':
        return { color: 'text-orange-600 bg-orange-50', icon: Wrench, label: 'Manutenção' };
      case 'inativo':
        return { color: 'text-gray-600 bg-gray-50', icon: XCircle, label: 'Inativo' };
      default:
        return { color: 'text-gray-600 bg-gray-50', icon: XCircle, label: 'Desconhecido' };
    }
  };

  const handleStatusChange = (chromebookId: string, newStatus: string) => {
    if (newStatus === 'emprestado') {
      alert('Para emprestar um Chromebook, use a seção de Empréstimos');
      return;
    }
    updateChromebookStatus(chromebookId, newStatus as any);
  };

  const handleEdit = (chromebook: any) => {
    setEditingChromebook(chromebook);
    setEditForm({
      patrimonio: chromebook.patrimonio,
      modelo: chromebook.modelo,
      serie: chromebook.serie,
      anoFabricacao: chromebook.anoFabricacao,
      status: chromebook.status,
      equipamentoProvisorizado: chromebook.equipamentoProvisorizado,
      observacoes: chromebook.observacoes || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editForm.patrimonio || !editForm.modelo || !editForm.serie) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    updateChromebook(editingChromebook.id, editForm);
    setShowEditModal(false);
    setEditingChromebook(null);
    alert('Chromebook atualizado com sucesso!');
  };

  const handleDeleteClick = (chromebook: any) => {
    setChromebookToDelete(chromebook);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (chromebookToDelete) {
      deleteChromebook(chromebookToDelete.id);
      setShowDeleteModal(false);
      setChromebookToDelete(null);
      alert('Chromebook excluído com sucesso!');
    }
  };

  const resetEditForm = () => {
    setEditForm({
      patrimonio: '',
      modelo: '',
      serie: '',
      anoFabricacao: '',
      status: 'disponivel',
      equipamentoProvisorizado: false,
      observacoes: '',
    });
  };

  // Mobile Card Component for Chromebook
  const ChromebookCard = ({ chromebook }: { chromebook: any }) => {
    const statusInfo = getStatusInfo(chromebook.status);
    const StatusIcon = statusInfo.icon;

    return (
      <MobileOptimizedCard>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <ResponsiveText variant="h4" className="font-semibold text-gray-900">
                {chromebook.patrimonio}
              </ResponsiveText>
              <ResponsiveText variant="body" className="text-gray-600 mt-1">
                {chromebook.modelo}
              </ResponsiveText>
            </div>
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
              <StatusIcon className="w-4 h-4" />
              {statusInfo.label}
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Série:</span>
              <span className="font-medium">{chromebook.serie}</span>
            </div>
            {chromebook.anoFabricacao && (
              <div className="flex justify-between">
                <span className="text-gray-600">Ano:</span>
                <span className="font-medium">{chromebook.anoFabricacao}</span>
              </div>
            )}
            {chromebook.equipamentoProvisorizado && (
              <div className="flex justify-between">
                <span className="text-gray-600">Provisorizado:</span>
                <span className="font-medium text-blue-600">Sim</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            <TouchFriendlyButton
              variant="outline"
              size="sm"
              onClick={() => setShowQRCode(chromebook.patrimonio)}
              className="flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              QR Code
            </TouchFriendlyButton>
            
            <TouchFriendlyButton
              variant="outline"
              size="sm"
              onClick={() => handleEdit(chromebook)}
              className="flex items-center justify-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Editar
            </TouchFriendlyButton>
          </div>

          {/* Status Change and Delete */}
          <div className="grid grid-cols-1 gap-2">
            <select
              value={chromebook.status}
              onChange={(e) => handleStatusChange(chromebook.id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              title="Alterar Status"
            >
              <option value="disponivel">Disponível</option>
              <option value="emprestado">Emprestado</option>
              <option value="manutencao">Manutenção</option>
              <option value="inativo">Inativo</option>
            </select>
            
            <TouchFriendlyButton
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteClick(chromebook)}
              className="flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </TouchFriendlyButton>
          </div>
        </div>
      </MobileOptimizedCard>
    );
  };

  return (
    <Layout 
      title="Inventário" 
      subtitle="Gerencie Chromebooks e visualize o status dos dispositivos cadastrados"
    >
      <MobileLayout>
        {/* Search and Filter */}
        <MobileOptimizedCard>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por patrimônio, modelo ou série..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-base"
              >
                <option value="all">Todos os Status</option>
                <option value="disponivel">Disponível</option>
                <option value="emprestado">Emprestado</option>
                <option value="manutencao">Manutenção</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>
        </MobileOptimizedCard>

        {/* Statistics */}
        <ResponsiveGrid cols={{ default: 2, md: 4 }} gap={4}>
          <MobileOptimizedCard className="text-center">
            <ResponsiveText variant="h2" className="font-bold text-gray-900">
              {chromebooks.length}
            </ResponsiveText>
            <ResponsiveText variant="caption">Total</ResponsiveText>
          </MobileOptimizedCard>
          
          <MobileOptimizedCard className="text-center">
            <ResponsiveText variant="h2" className="font-bold text-green-600">
              {chromebooks.filter(c => c.status === 'disponivel').length}
            </ResponsiveText>
            <ResponsiveText variant="caption">Disponíveis</ResponsiveText>
          </MobileOptimizedCard>
          
          <MobileOptimizedCard className="text-center">
            <ResponsiveText variant="h2" className="font-bold text-purple-600">
              {chromebooks.filter(c => c.status === 'emprestado').length}
            </ResponsiveText>
            <ResponsiveText variant="caption">Emprestados</ResponsiveText>
          </MobileOptimizedCard>
          
          <MobileOptimizedCard className="text-center">
            <ResponsiveText variant="h2" className="font-bold text-orange-600">
              {chromebooks.filter(c => c.status === 'manutencao').length}
            </ResponsiveText>
            <ResponsiveText variant="caption">Manutenção</ResponsiveText>
          </MobileOptimizedCard>
        </ResponsiveGrid>

        {/* Chromebooks List */}
        <div>
          <ResponsiveText variant="h3" className="mb-4 text-gray-900 font-semibold">
            Chromebooks ({filteredChromebooks.length})
          </ResponsiveText>
          
          {filteredChromebooks.length === 0 ? (
            <MobileOptimizedCard className="text-center py-8">
              <ResponsiveText variant="body" className="text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Nenhum Chromebook encontrado com os filtros aplicados' 
                  : 'Nenhum Chromebook cadastrado'
                }
              </ResponsiveText>
            </MobileOptimizedCard>
          ) : (
            <div className="space-y-4">
              {filteredChromebooks.map((chromebook) => (
                <ChromebookCard key={chromebook.id} chromebook={chromebook} />
              ))}
            </div>
          )}
        </div>
      </MobileLayout>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <ResponsiveText variant="h3" className="font-semibold text-gray-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-green-600" />
                Editar Chromebook
              </ResponsiveText>
              <TouchFriendlyButton
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingChromebook(null);
                  resetEditForm();
                }}
              >
                <X className="w-5 h-5" />
              </TouchFriendlyButton>
            </div>
            
            <div className="p-6">
              <form className="space-y-6">
                {/* ID do Chromebook */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID do Chromebook *
                  </label>
                  <input
                    type="text"
                    value={editForm.patrimonio}
                    onChange={(e) => setEditForm({ ...editForm, patrimonio: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                    placeholder="Digite o ID único do Chromebook"
                    required
                  />
                </div>

                {/* Modelo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modelo *
                  </label>
                  <input
                    type="text"
                    value={editForm.modelo}
                    onChange={(e) => setEditForm({ ...editForm, modelo: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                    placeholder="Ex: Chromebook 14a"
                    required
                  />
                </div>

                {/* Série */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Série *
                  </label>
                  <input
                    type="text"
                    value={editForm.serie}
                    onChange={(e) => setEditForm({ ...editForm, serie: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                    placeholder="Digite o número da série"
                    required
                  />
                </div>

                {/* Ano de Fabricação */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ano de Fabricação
                  </label>
                  <input
                    type="text"
                    value={editForm.anoFabricacao}
                    onChange={(e) => setEditForm({ ...editForm, anoFabricacao: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                    placeholder="Ex: 2023"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                  >
                    <option value="disponivel">Disponível</option>
                    <option value="emprestado">Emprestado</option>
                    <option value="manutencao">Manutenção</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>

                {/* Equipamento Provisorizado */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="editEquipamentoProvisorizado"
                    checked={editForm.equipamentoProvisorizado}
                    onChange={(e) => setEditForm({ ...editForm, equipamentoProvisorizado: e.target.checked })}
                    className="mt-1 h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <div>
                    <label htmlFor="editEquipamentoProvisorizado" className="text-sm font-medium text-gray-700">
                      Equipamento Provisorizado
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Marque se o Chromebook é uma provisorização no sistema de administração
                    </p>
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={editForm.observacoes}
                    onChange={(e) => setEditForm({ ...editForm, observacoes: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                    placeholder="Digite observações relevantes sobre o equipamento"
                    rows={3}
                  />
                </div>
              </form>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 p-6 border-t">
              <TouchFriendlyButton
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingChromebook(null);
                  resetEditForm();
                }}
                className="w-full sm:w-auto"
              >
                Cancelar
              </TouchFriendlyButton>
              <TouchFriendlyButton
                onClick={handleSaveEdit}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Salvar Alterações
              </TouchFriendlyButton>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <ResponsiveText variant="h3" className="font-semibold text-gray-900">
                  Confirmar Exclusão
                </ResponsiveText>
              </div>
              
              <ResponsiveText variant="body" className="text-gray-600 mb-6">
                Tem certeza que deseja excluir o Chromebook <strong>{chromebookToDelete?.patrimonio}</strong>? 
                Esta ação não pode ser desfeita.
              </ResponsiveText>
              
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <TouchFriendlyButton
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setChromebookToDelete(null);
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </TouchFriendlyButton>
                <TouchFriendlyButton
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  className="w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </TouchFriendlyButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <ResponsiveText variant="h3" className="font-semibold text-gray-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                QR Code - {showQRCode}
              </ResponsiveText>
              <TouchFriendlyButton
                variant="ghost"
                size="icon"
                onClick={() => setShowQRCode(null)}
              >
                <X className="w-5 h-5" />
              </TouchFriendlyButton>
            </div>
            
            <div className="text-center">
              <QRCodeGenerator value={showQRCode} />
              <ResponsiveText variant="body" className="mt-4 text-gray-600">
                Use este QR Code para empréstimos e devoluções rápidas
              </ResponsiveText>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Inventario;
