import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://pdtkktctffnjxjputxgt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkdGtrdGN0ZmZuanhqcHV0eGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3ODE4NDcsImV4cCI6MjA1NzM1Nzg0N30.4ZjTiWATAiEYCYEz89iK4X1-DGhVlTZXy_v9-PJC4Ww";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function signupTestUser() {
    console.log('🚀 Tentando cadastrar o usuário manutencao.teste@colegiosaojudas.com.br...');

    const { data, error } = await supabase.auth.signUp({
        email: 'manutencao.teste@colegiosaojudas.com.br',
        password: 'Manu123!',
        options: {
            data: {
                name: 'MANUTENÇÃO TESTE'
            }
        }
    });

    if (error) {
        console.error('❌ Erro no cadastro:', error.message);
        
        if (error.message.includes('already registered')) {
            console.log('ℹ️ O usuário já estava cadastrado anteriormente.');
        }
        return;
    }

    console.log('✅ Solicitação de cadastro executada!');
    console.log('Resultado:', JSON.stringify(data, null, 2));
    
    // Verificando perfil criado no banco
    console.log('🔍 Consultando perfil criado na tabela de profiles...');
    const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'manutencao.teste@colegiosaojudas.com.br')
        .maybeSingle();
        
    if (profileErr) {
        console.error('⚠️ Erro ao buscar profile:', profileErr.message);
    } else if (profile) {
        console.log('🎉 Perfil encontrado com sucesso:', JSON.stringify(profile, null, 2));
    } else {
        console.log('ℹ️ Perfil ainda não inserido (pode necessitar de confirmação de e-mail).');
    }
}

signupTestUser();
