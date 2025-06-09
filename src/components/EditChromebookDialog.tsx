
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import { Monitor, Hash, FileText, MapPin, Calendar, StickyNote, Save, X, Settings } from "lucide-react";

interface Chromebook {
  id: string;
  brand: string;
  model: string;
  serialNumber: string;
  patrimony: string;
  status: 'disponivel' | 'emprestado' | 'manutencao' | 'danificado';
  location?: string;
  acquisitionDate?: string;
  notes?: string;
  manufacturingYear?: string;
  isProvisioned?: boolean;
}

interface EditChromebookDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chromebook: Chromebook | null;
  onSave: (chromebook: Chromebook) => void;
}

export function EditChromebookDialog({ isOpen, onClose, chromebook, onSave }: EditChromebookDialogProps) {
  const { isMobile } = useMobile();
  const [editingChromebook, setEditingChromebook] = useState<Chromebook | null>(null);

  useEffect(() => {
    if (chromebook) {
      setEditingChromebook({ ...chromebook });
    }
  }, [chromebook]);

  const handleSave = () => {
    if (!editingChromebook) return;

    if (!editingChromebook.id || !editingChromebook.brand || !editingChromebook.model || 
        !editingChromebook.serialNumber) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    onSave(editingChromebook);
    onClose();
    
    toast({
      title: "Sucesso",
      description: "Chromebook atualizado com sucesso",
    });
  };

  const handleCancel = () => {
    onClose();
    setEditingChromebook(null);
  };

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent 
          side="bottom" 
          className="h-[100dvh] max-h-[100dvh] p-0 bg-white border-0 rounded-t-2xl fixed inset-x-0 bottom-0 z-[100]"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 100,
            height: '100vh',
            maxHeight: '100vh',
            width: '100vw',
            borderRadius: 0,
          }}
        >
          <div className="flex flex-col h-full bg-white">
            {/* Fixed Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Monitor className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Editar Chromebook</h2>
                    <p className="text-blue-100 text-sm">Atualize as informações do Chromebook. Os campos marcados com * são obrigatórios.</p>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={handleCancel}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-white text-blue-600 hover:bg-blue-50"
                  onClick={handleSave}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              <div className="p-4 space-y-4 pb-8">
                {/* Basic Information */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Hash className="h-4 w-4 mr-2 text-blue-600" />
                    Informações Básicas
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">ID do Chromebook *</Label>
                      <Input
                        value={editingChromebook?.id || ''}
                        onChange={(e) => editingChromebook && setEditingChromebook({
                          ...editingChromebook,
                          id: e.target.value
                        })}
                        className="mt-1"
                        placeholder="Digite o ID"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Fabricante *</Label>
                      <Input
                        value={editingChromebook?.brand || ''}
                        onChange={(e) => editingChromebook && setEditingChromebook({
                          ...editingChromebook,
                          brand: e.target.value
                        })}
                        className="mt-1"
                        placeholder="Digite o fabricante"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Modelo *</Label>
                      <Input
                        value={editingChromebook?.model || ''}
                        onChange={(e) => editingChromebook && setEditingChromebook({
                          ...editingChromebook,
                          model: e.target.value
                        })}
                        className="mt-1"
                        placeholder="Digite o modelo"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Série *</Label>
                      <Input
                        value={editingChromebook?.serialNumber || ''}
                        onChange={(e) => editingChromebook && setEditingChromebook({
                          ...editingChromebook,
                          serialNumber: e.target.value
                        })}
                        className="mt-1"
                        placeholder="Digite a série"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Technical Details */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-green-600" />
                    Detalhes Técnicos
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Ano de Fabricação</Label>
                        <Input
                          type="number"
                          value={editingChromebook?.manufacturingYear || ''}
                          onChange={(e) => editingChromebook && setEditingChromebook({
                            ...editingChromebook,
                            manufacturingYear: e.target.value
                          })}
                          className="mt-1"
                          placeholder="Digite o ano"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Patrimônio</Label>
                        <Input
                          value={editingChromebook?.patrimony || ''}
                          onChange={(e) => editingChromebook && setEditingChromebook({
                            ...editingChromebook,
                            patrimony: e.target.value
                          })}
                          className="mt-1"
                          placeholder="Digite o número do patrimônio"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Status</Label>
                      <Select
                        value={editingChromebook?.status || 'disponivel'}
                        onValueChange={(value: 'disponivel' | 'emprestado' | 'manutencao' | 'danificado') => 
                          editingChromebook && setEditingChromebook({
                            ...editingChromebook,
                            status: value
                          })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="disponivel">🟢 Disponível</SelectItem>
                          <SelectItem value="emprestado">🔵 Emprestado</SelectItem>
                          <SelectItem value="manutencao">🟡 Manutenção</SelectItem>
                          <SelectItem value="danificado">🔴 Danificado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Location & Provisioning */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Settings className="h-4 w-4 mr-2 text-purple-600" />
                    Configurações e Local
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Local</Label>
                      <Input
                        value={editingChromebook?.location || ''}
                        onChange={(e) => editingChromebook && setEditingChromebook({
                          ...editingChromebook,
                          location: e.target.value
                        })}
                        className="mt-1"
                        placeholder="Ex: Sala 101"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Data de Aquisição
                      </Label>
                      <Input
                        type="date"
                        value={editingChromebook?.acquisitionDate || ''}
                        onChange={(e) => editingChromebook && setEditingChromebook({
                          ...editingChromebook,
                          acquisitionDate: e.target.value
                        })}
                        className="mt-1"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isProvisioned"
                        checked={editingChromebook?.isProvisioned || false}
                        onCheckedChange={(checked) => editingChromebook && setEditingChromebook({
                          ...editingChromebook,
                          isProvisioned: checked as boolean
                        })}
                      />
                      <Label htmlFor="isProvisioned" className="text-sm font-medium text-gray-700">
                        Equipamento já provisionado
                      </Label>
                    </div>

                    {editingChromebook?.isProvisioned && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700 flex items-center">
                          <StickyNote className="h-3 w-3 mr-1" />
                          Observações
                        </Label>
                        <Textarea
                          value={editingChromebook?.notes || ''}
                          onChange={(e) => editingChromebook && setEditingChromebook({
                            ...editingChromebook,
                            notes: e.target.value
                          })}
                          className="mt-1 min-h-[80px] resize-none"
                          placeholder="Digite observações relevantes sobre o equipamento"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl mx-auto max-h-[85vh] overflow-hidden flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg -m-6 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Editar Chromebook</DialogTitle>
              <DialogDescription className="text-blue-100">
                Atualize as informações do Chromebook. Os campos marcados com * são obrigatórios.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Basic Information Card */}
            <Card className="shadow-md border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center text-gray-800">
                  <Hash className="h-5 w-5 mr-2 text-blue-600" />
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-id-desktop" className="text-gray-700 font-medium">ID do Chromebook *</Label>
                    <Input
                      id="edit-id-desktop"
                      value={editingChromebook?.id || ''}
                      onChange={(e) => editingChromebook && setEditingChromebook({
                        ...editingChromebook,
                        id: e.target.value
                      })}
                      placeholder="Digite o ID"
                      className="border-gray-200 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-brand-desktop" className="text-gray-700 font-medium">Fabricante *</Label>
                    <Input
                      id="edit-brand-desktop"
                      value={editingChromebook?.brand || ''}
                      onChange={(e) => editingChromebook && setEditingChromebook({
                        ...editingChromebook,
                        brand: e.target.value
                      })}
                      placeholder="Digite o fabricante"
                      className="border-gray-200 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-model-desktop" className="text-gray-700 font-medium">Modelo *</Label>
                    <Input
                      id="edit-model-desktop"
                      value={editingChromebook?.model || ''}
                      onChange={(e) => editingChromebook && setEditingChromebook({
                        ...editingChromebook,
                        model: e.target.value
                      })}
                      placeholder="Digite o modelo"
                      className="border-gray-200 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-serial-desktop" className="text-gray-700 font-medium">Série *</Label>
                    <Input
                      id="edit-serial-desktop"
                      value={editingChromebook?.serialNumber || ''}
                      onChange={(e) => editingChromebook && setEditingChromebook({
                        ...editingChromebook,
                        serialNumber: e.target.value
                      })}
                      placeholder="Digite a série"
                      className="border-gray-200 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Details Card */}
            <Card className="shadow-md border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center text-gray-800">
                  <FileText className="h-5 w-5 mr-2 text-green-600" />
                  Detalhes Técnicos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-year-desktop" className="text-gray-700 font-medium">Ano de Fabricação</Label>
                    <Input
                      id="edit-year-desktop"
                      type="number"
                      value={editingChromebook?.manufacturingYear || ''}
                      onChange={(e) => editingChromebook && setEditingChromebook({
                        ...editingChromebook,
                        manufacturingYear: e.target.value
                      })}
                      placeholder="Digite o ano"
                      className="border-gray-200 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-patrimony-desktop" className="text-gray-700 font-medium">Patrimônio</Label>
                    <Input
                      id="edit-patrimony-desktop"
                      value={editingChromebook?.patrimony || ''}
                      onChange={(e) => editingChromebook && setEditingChromebook({
                        ...editingChromebook,
                        patrimony: e.target.value
                      })}
                      placeholder="Digite o número do patrimônio"
                      className="border-gray-200 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-status-desktop" className="text-gray-700 font-medium">Status</Label>
                  <Select
                    value={editingChromebook?.status || 'disponivel'}
                    onValueChange={(value: 'disponivel' | 'emprestado' | 'manutencao' | 'danificado') => 
                      editingChromebook && setEditingChromebook({
                        ...editingChromebook,
                        status: value
                      })
                    }
                  >
                    <SelectTrigger className="border-gray-200 focus:border-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disponivel">🟢 Disponível</SelectItem>
                      <SelectItem value="emprestado">🔵 Emprestado</SelectItem>
                      <SelectItem value="manutencao">🟡 Manutenção</SelectItem>
                      <SelectItem value="danificado">🔴 Danificado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Configuration & Location Card */}
            <Card className="shadow-md border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center text-gray-800">
                  <Settings className="h-5 w-5 mr-2 text-purple-600" />
                  Configurações e Localização
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-location-desktop" className="text-gray-700 font-medium">Local</Label>
                    <Input
                      id="edit-location-desktop"
                      value={editingChromebook?.location || ''}
                      onChange={(e) => editingChromebook && setEditingChromebook({
                        ...editingChromebook,
                        location: e.target.value
                      })}
                      placeholder="Ex: Sala 101"
                      className="border-gray-200 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-acquisition-desktop" className="text-gray-700 font-medium flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Data de Aquisição
                    </Label>
                    <Input
                      id="edit-acquisition-desktop"
                      type="date"
                      value={editingChromebook?.acquisitionDate || ''}
                      onChange={(e) => editingChromebook && setEditingChromebook({
                        ...editingChromebook,
                        acquisitionDate: e.target.value
                      })}
                      className="border-gray-200 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isProvisionedDesktop"
                    checked={editingChromebook?.isProvisioned || false}
                    onCheckedChange={(checked) => editingChromebook && setEditingChromebook({
                      ...editingChromebook,
                      isProvisioned: checked as boolean
                    })}
                  />
                  <Label htmlFor="isProvisionedDesktop" className="text-gray-700 font-medium">
                    Equipamento já provisionado
                  </Label>
                </div>

                {editingChromebook?.isProvisioned && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-notes-desktop" className="text-gray-700 font-medium flex items-center">
                      <StickyNote className="h-4 w-4 mr-1" />
                      Observações
                    </Label>
                    <Textarea
                      id="edit-notes-desktop"
                      value={editingChromebook?.notes || ''}
                      onChange={(e) => editingChromebook && setEditingChromebook({
                        ...editingChromebook,
                        notes: e.target.value
                      })}
                      placeholder="Digite observações relevantes sobre o equipamento"
                      className="min-h-[80px] border-gray-200 focus:border-blue-500"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={handleCancel} className="bg-gray-200 text-black hover:bg-gray-300">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-green-600 text-white hover:bg-green-700">
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
