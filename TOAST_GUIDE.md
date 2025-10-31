# Guia do Sistema de Notificações (Toast)

O sistema de notificações foi atualizado para usar o **Sonner** com um design system personalizado, oferecendo feedback visual e funcional mais rico e consistente.

A API principal está disponível através do hook de compatibilidade `useToast` (ou diretamente importando `toast` de `@/hooks/use-toast`).

## 1. API de Uso

A função `toast` agora é tipada e oferece métodos diretos para cada variante:

| Método | Descrição | Duração Padrão | Ícone |
| :--- | :--- | :--- | :--- |
| `toast.success(title, options)` | Operação concluída com êxito. | 3000ms | ✅ CheckCircle |
| `toast.error(title, options)` | Falha crítica ou erro de sistema. | 5000ms | ❌ XCircle |
| `toast.warning(title, options)` | Problema não crítico ou aviso de validação. | 4000ms | ⚠️ AlertTriangle |
| `toast.info(title, options)` | Informação geral ou feedback neutro. | 3000ms | ℹ️ Info |
| `toast.loading(title, options)` | Operação em andamento (requer `toast.dismiss` manual). | Infinito | 🔄 Loader2 (Spinning) |
| `toast.promise(promise, msgs, options)` | Gerencia estados de promessas (loading, success, error). | 4000ms | Varia |

### Exemplo de Uso Básico

```typescript
import { toast } from '@/hooks/use-toast';

// Sucesso
toast.success("Chromebook cadastrado!", {
  description: "ID: CHR045 | Modelo: Lenovo 300e"
});

// Erro
toast.error("Falha ao salvar dados", {
  description: "Verifique sua conexão de rede."
});

// Aviso com Ação
toast.warning("Permissão negada", {
  description: "Apenas administradores podem excluir usuários.",
  action: {
    label: "Ver Configurações",
    onClick: () => navigate('/settings')
  }
});
```

### Exemplo de Uso com `toast.promise`

Use `toast.promise` para operações assíncronas (como chamadas de API) para gerenciar automaticamente os estados de carregamento, sucesso e erro.

```typescript
const handleSave = async () => {
  const savePromise = api.saveData(formData);

  toast.promise(savePromise, {
    loading: "Salvando alterações no inventário...",
    success: (data) => `Item ${data.id} salvo com sucesso!`,
    error: (error) => `Erro ao salvar: ${error.message}`,
  });
};
```

## 2. Configurações Avançadas (Opções)

O objeto `options` permite personalizar o comportamento do toast:

| Opção | Tipo | Descrição |
| :--- | :--- | :--- |
| `description` | `React.ReactNode` | Conteúdo secundário abaixo do título. |
| `duration` | `number` | Duração em milissegundos (sobrescreve o padrão). |
| `action` | `{ label: string, onClick: () => void }` | Adiciona um botão de ação. |
| `priority` | `'critical' \| 'high' \| 'normal' \| 'low'` | Define a prioridade. Toasts `critical` não fecham automaticamente e são usados para alertas de sistema. |

## 3. Design e Responsividade

O `<Toaster />` está configurado com:

*   **Design:** Glassmorphism elegante com bordas suaves e sombras sutis.
*   **Responsividade:**
    *   Desktop: Posição `top-right` (canto superior direito).
    *   Mobile: Posição `top-center` (centralizado no topo) com largura total (`95vw`) para melhor usabilidade.
*   **Cores:** As cores dos ícones e bordas são contextuais (verde para sucesso, vermelho para erro, etc.).