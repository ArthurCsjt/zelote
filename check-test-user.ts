
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://pdtkktctffnjxjputxgt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkdGtrdGN0ZmZuanhqcHV0eGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3ODE4NDcsImV4cCI6MjA1NzM1Nzg0N30.4ZjTiWATAiEYCYEz89iK4X1-DGhVlTZXy_v9-PJC4Ww";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkUser() {
    console.log('🔍 Verificando usuário teste@sj.pro.br...');

    // Consultar a tabela profiles diretamente
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'teste@sj.pro.br')
        .maybeSingle();

    if (error) {
        console.error('❌ Erro ao consultar profiles:', error.message);
        return;
    }

    if (data) {
        console.log('✅ Usuário encontrado no banco de dados!');
        console.log('Dados do Perfil:', JSON.stringify(data, null, 2));
    } else {
        console.log('❌ Usuário teste@sj.pro.br NÃO encontrado na tabela de perfis.');
        console.log('Dica: Como eu não tenho a chave de administrador (Service Role), não consigo criar o usuário no sistema de autenticação diretamente.');
        console.log('Ação Sugerida: Use a tela de cadastro do aplicativo para registrar o e-mail teste@sj.pro.br. As regras que configuramos no banco de dados farão o resto automaticamente!');
    }
}

checkUser();
