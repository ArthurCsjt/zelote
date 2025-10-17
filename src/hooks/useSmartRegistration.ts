import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { normalizeChromebookId } from '@/utils/security';
import type { Chromebook, ChromebookStatus } from '@/types/database';

// Interface para os dados brutos lidos do QR Code
interface QRCodeData {
  id: string; // CHRxxx
  fabricante?: string;
  modelo?: string;
  numero_serie?: string;
  patrimonio?: string;
  ano_fabricacao?: string;
  status_provisionamento?: string; // 'provisionado' | 'desprovisionado'
  localizacao?: string;
  condicao?: string;
}

// Interface para o item registrado na sessão
export interface RegisteredItem {
  id: string; // UUID do DB
  chromebook_id: string; // CHRxxx
  model: string;
  status: ChromebookStatus;
  source: 'qr_code' | 'manual';
  timestamp: string;
}

export function useSmartRegistration() {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [registeredItems, setRegisteredItems] = useState<RegisteredItem[]>([]);

  // Função de mapeamento e transformação de dados
  const mapAndTransformData = useCallback((data: QRCodeData, createdBy: string): Partial<Chromebook> => {
    // Lógica de transformação de status
    let status: ChromebookStatus = 'disponivel';
    let isDeprovisioned = false;

    if (data.status_provisionamento?.toLowerCase() === 'desprovisionado') {
      status = 'fora_uso';
      isDeprovisioned = true;
    }
    
    // Mapeamento final para o schema do Supabase
    return {
      chromebook_id: normalizeChromebookId(data.id),
      manufacturer: data.fabricante,
      model: data.modelo || 'Modelo Desconhecido',
      serial_number: data.numero_serie,
      patrimony_number: data.patrimonio,
      location: data.localizacao,
      condition: data.condicao || 'bom',
      status: status,
      is_deprovisioned: isDeprovisioned,
      created_by: createdBy,
    };
  }, []);

  // Função principal para registrar via QR Code (JSON)
  const registerFromQRCode = useCallback(async (data: QRCodeData) => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }
    if (!data.numero_serie) {
      toast({ title: "Erro", description: "O QR Code deve conter o 'numero_serie' para identificação única.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    const serialNumber = data.numero_serie;

    try {
      // 1. Verificar Duplicatas pelo Número de Série
      const { data: existingCb, error: checkError } = await supabase
        .from('chromebooks')
        .select('id, chromebook_id')
        .eq('serial_number', serialNumber)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existingCb) {
        toast({
          title: "Item Duplicado",
          description: `Chromebook ${existingCb.chromebook_id} (Série: ${serialNumber}) já existe.`,
          variant: "destructive",
        });
        return;
      }

      // 2. Mapear e Transformar Dados
      const insertData = mapAndTransformData(data, user.id);

      // 3. Inserir no Banco de Dados
      const { data: newCb, error: insertError } = await supabase
        .from('chromebooks')
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;

      // 4. Atualizar Feedback em Tempo Real
      const registeredItem: RegisteredItem = {
        id: newCb.id,
        chromebook_id: newCb.chromebook_id,
        model: newCb.model,
        status: newCb.status,
        source: 'qr_code',
        timestamp: new Date().toISOString(),
      };
      setRegisteredItems(prev => [registeredItem, ...prev]);

      toast({
        title: "Cadastro Inteligente Concluído",
        description: `ID: ${newCb.chromebook_id} - Modelo: ${newCb.model}`,
        variant: "success",
      });

    } catch (e: any) {
      console.error('Erro no cadastro inteligente:', e);
      toast({
        title: "Erro ao Salvar",
        description: e.message || "Falha ao processar e salvar o Chromebook.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [user, mapAndTransformData]);

  // Função para registrar via Entrada Manual (apenas ID)
  const registerFromManualId = useCallback(async (identifier: string) => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }
    
    setIsProcessing(true);
    const normalizedId = normalizeChromebookId(identifier);

    try {
      // 1. Verificar Duplicatas pelo ID Amigável (CHRxxx)
      const { data: existingCb, error: checkError } = await supabase
        .from('chromebooks')
        .select('id, chromebook_id')
        .eq('chromebook_id', normalizedId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existingCb) {
        toast({
          title: "Item Duplicado",
          description: `Chromebook ${normalizedId} já existe. Use o inventário para editar.`,
          variant: "destructive",
        });
        return;
      }

      // 2. Inserir com valores padrão (o trigger set_chromebook_id será ignorado se o ID for fornecido)
      const { data: newCb, error: insertError } = await supabase
        .from('chromebooks')
        .insert({
          chromebook_id: normalizedId,
          model: 'Modelo Padrão (Manual)',
          manufacturer: 'Manual',
          serial_number: `MANUAL-${Date.now()}`, // Gera um serial único para evitar conflitos
          status: 'disponivel',
          condition: 'Cadastro manual, verificar detalhes.',
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 3. Atualizar Feedback em Tempo Real
      const registeredItem: RegisteredItem = {
        id: newCb.id,
        chromebook_id: newCb.chromebook_id,
        model: newCb.model,
        status: newCb.status,
        source: 'manual',
        timestamp: new Date().toISOString(),
      };
      setRegisteredItems(prev => [registeredItem, ...prev]);

      toast({
        title: "Cadastro Manual Concluído",
        description: `ID: ${newCb.chromebook_id}. Detalhes incompletos.`,
        variant: "info",
      });

    } catch (e: any) {
      console.error('Erro no cadastro manual:', e);
      toast({
        title: "Erro ao Salvar Manualmente",
        description: e.message || "Falha ao processar e salvar o Chromebook.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [user]);

  return {
    isProcessing,
    registeredItems,
    registerFromQRCode,
    registerFromManualId,
  };
}