import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://pdtkktctffnjxjputxgt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkdGtrdGN0ZmZuanhqcHV0eGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3ODE4NDcsImV4cCI6MjA1NzM1Nzg0N30.4ZjTiWATAiEYCYEz89iK4X1-DGhVlTZXy_v9-PJC4Ww";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkData() {
    console.log('--- Checking for loans with reservation_id ---');
    const { data, error } = await supabase
        .from('loans')
        .select('id, student_name, reservation_id')
        .not('reservation_id', 'is', null)
        .limit(5);

    if (error) {
        console.error('Error:', error.message);
        if (error.message.includes('column "reservation_id" does not exist')) {
            console.log('❌ COLUMN MISSING: The migration was NOT applied or failed.');
        }
    } else if (data && data.length > 0) {
        console.log('✅ Found', data.length, 'loans with reservation_id! The system is working.');
        console.log('Sample data:', data);
    } else {
        console.log('ℹ️ No loans found with reservation_id yet. Either no loans were created from reservations, or they didnt save correctly.');

        // Let's check the view as well
        const { data: viewData, error: viewError } = await supabase.from('loan_history').select('*').limit(1);
        if (viewError) {
            console.log('Error checking view:', viewError.message);
        } else if (viewData && viewData.length > 0) {
            if ('reservation_id' in viewData[0]) {
                console.log('✅ reservation_id column exists in loan_history view.');
            } else {
                console.log('❌ reservation_id column is MISSING in loan_history view.');
            }
        }
    }
}

checkData();
