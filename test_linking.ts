import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://pdtkktctffnjxjputxgt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkdGtrdGN0ZmZuanhqcHV0eGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3ODE4NDcsImV4cCI6MjA1NzM1Nzg0N30.4ZjTiWATAiEYCYEz89iK4X1-DGhVlTZXy_v9-PJC4Ww";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testInsert() {
    console.log('--- Attempting to find a reservation and link a loan to it ---');

    // 1. Get a reservation ID
    const { data: resData } = await supabase.from('reservations').select('id').limit(1);

    if (!resData || resData.length === 0) {
        console.log('No reservations found. Cant test linking.');
        return;
    }

    const reservationId = resData[0].id;
    console.log('Found reservation ID:', reservationId);

    // 2. Get a chromebook ID
    const { data: cbData } = await supabase.from('chromebooks').select('id').limit(1);
    if (!cbData || cbData.length === 0) {
        console.log('No chromebooks found.');
        return;
    }
    const chromebookId = cbData[0].id;

    // 3. Try to insert a loan linking to it
    // Note: This might fail RLS if not authenticated, but we want to see if the column is accepted
    const { data, error } = await supabase.from('loans').insert({
        chromebook_id: chromebookId,
        student_name: 'TEST LINKING',
        student_email: 'test@linking.com',
        purpose: 'Testing link to reservation',
        reservation_id: reservationId
    }).select();

    if (error) {
        console.log('Error during insert:', error.message);
        if (error.message.includes('column "reservation_id" of relation "loans" does not exist')) {
            console.log('❌ COLUMN REALLY MISSING IN TABLE');
        }
    } else {
        console.log('✅ INSERT SUCCESSFUL! Column exists and accepts data.');
        console.log('Inserted loan:', data);

        // Now check if it shows up in loan_history view
        const { data: viewData, error: viewError } = await supabase
            .from('loan_history')
            .select('id, reservation_id')
            .eq('id', data[0].id);

        if (viewError) {
            console.log('View error:', viewError.message);
        } else {
            console.log('View result:', viewData);
            if (viewData[0]?.reservation_id === reservationId) {
                console.log('✅ VIEW WORKING! reservation_id is correctly mapped.');
            } else {
                console.log('❌ VIEW NOT MAPPING reservation_id correctly.');
            }
        }
    }
}

testInsert();
