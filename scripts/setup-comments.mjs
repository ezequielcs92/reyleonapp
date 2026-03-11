import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jtknertrqhszjdgmdgzv.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function setup() {
    console.log('1. Checking post_comments table...');
    const { data: cols, error: colsErr } = await supabase
        .from('post_comments')
        .select('id')
        .limit(1);

    if (colsErr && colsErr.message.includes('relation "public.post_comments" does not exist')) {
        console.log('   Table post_comments does not exist, creating...');
        // We cannot easily run DDL via the rest API using supabase-js client directly.
        // However, we can try to use standard rpc if an exec_sql rpc is available, or we will have to ask the user to create it if we can't do it via powershell/node.
        console.log('   Please create the table manually or use migrations.');
    } else if (colsErr) {
        console.error('   Error checking post_comments:', colsErr);
    } else {
        console.log('   Table post_comments already exists ✓');
    }
}

setup().catch(console.error);
