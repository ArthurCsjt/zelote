// Script de teste para verificar a conexão com o Supabase
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://pdtkktctffnjxjputxgt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkdGtrdGN0ZmZuanhqcHV0eGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3ODE4NDcsImV4cCI6MjA1NzM1Nzg0N30.4ZjTiWATAiEYCYEz89iK4X1-DGhVlTZXy_v9-PJC4Ww";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testSupabaseConnection() {
    console.log('🔍 Iniciando testes do Supabase...\n');

    // Teste 1: Verificar URL e credenciais
    console.log('✅ Teste 1: Configuração');
    console.log(`   URL: ${SUPABASE_URL}`);
    console.log(`   Key configurada: ${SUPABASE_PUBLISHABLE_KEY.substring(0, 20)}...`);
    console.log('');

    // Teste 2: Verificar conexão básica
    console.log('🔄 Teste 2: Testando conexão com o banco de dados...');
    try {
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });

        if (error) {
            console.log(`   ❌ Erro ao conectar: ${error.message}`);
            console.log(`   Detalhes: ${JSON.stringify(error, null, 2)}`);
        } else {
            console.log('   ✅ Conexão com o banco estabelecida com sucesso!');
        }
    } catch (err) {
        console.log(`   ❌ Exceção ao tentar conectar: ${err}`);
    }
    console.log('');

    // Teste 3: Listar tabelas disponíveis (tentar consultar algumas tabelas conhecidas)
    console.log('🔄 Teste 3: Verificando acesso às tabelas...');
    const tables = ['users', 'equipment', 'loans', 'reservations', 'profiles'];

    for (const table of tables) {
        try {
            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.log(`   ❌ Tabela '${table}': ${error.message}`);
            } else {
                console.log(`   ✅ Tabela '${table}': Acessível (${count ?? 0} registros)`);
            }
        } catch (err) {
            console.log(`   ❌ Tabela '${table}': Erro - ${err}`);
        }
    }
    console.log('');

    // Teste 4: Verificar autenticação
    console.log('🔄 Teste 4: Verificando estado de autenticação...');
    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.log(`   ⚠️  Erro ao verificar sessão: ${error.message}`);
        } else if (session) {
            console.log(`   ✅ Usuário autenticado: ${session.user.email}`);
        } else {
            console.log('   ℹ️  Nenhum usuário autenticado (esperado para teste)');
        }
    } catch (err) {
        console.log(`   ❌ Exceção ao verificar autenticação: ${err}`);
    }
    console.log('');

    // Teste 5: Verificar funções RPC (se existirem)
    console.log('🔄 Teste 5: Testando funções RPC...');
    try {
        // Tentar chamar uma função RPC comum
        const { data, error } = await supabase.rpc('get_equipment_stats');

        if (error) {
            if (error.message.includes('not found')) {
                console.log('   ℹ️  Função RPC não encontrada (pode não existir ainda)');
            } else {
                console.log(`   ⚠️  Erro ao chamar RPC: ${error.message}`);
            }
        } else {
            console.log('   ✅ Função RPC executada com sucesso!');
            console.log(`   Resultado: ${JSON.stringify(data, null, 2)}`);
        }
    } catch (err) {
        console.log(`   ℹ️  RPC não disponível ou erro: ${err}`);
    }
    console.log('');

    // Resumo
    console.log('📊 RESUMO DA VERIFICAÇÃO');
    console.log('========================');
    console.log('✅ Cliente Supabase inicializado corretamente');
    console.log('✅ URL e credenciais configuradas');
    console.log('ℹ️  Execute este script com: npx tsx test-supabase.ts');
    console.log('');
}

// Executar testes
testSupabaseConnection()
    .then(() => {
        console.log('✅ Testes concluídos!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Erro fatal durante os testes:', error);
        process.exit(1);
    });
