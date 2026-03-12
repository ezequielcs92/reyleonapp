import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    throw new Error('Missing Supabase URL. Set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL before running this script.');
}

if (!serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY before running this script.');
}

const supabase = createClient(supabaseUrl, serviceKey);

// Upload a real PNG (1x1 pixel) to test
const png1x1 = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
);

const { data, error } = await supabase.storage
    .from('post-images')
    .upload(`test/test-${Date.now()}.png`, png1x1, {
        contentType: 'image/png',
        upsert: true
    });

if (error) {
    console.log('Upload failed:', error.message);
} else {
    const { data: url } = supabase.storage.from('post-images').getPublicUrl(data.path);
    console.log('Upload OK ✓ Public URL:', url.publicUrl);
    await supabase.storage.from('post-images').remove([data.path]);
    console.log('Cleaned up ✓');
}
