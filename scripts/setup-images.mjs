import { createClient } from '@supabase/supabase-js';

const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0a25lcnRycWhzempkZ21kZ3p2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI0MDQzMCwiZXhwIjoyMDg4ODE2NDMwfQ.FBJKuXX4iW6UNvBfNe6c7VWX8gUttZefcQcYfXtgmpE';
const supabase = createClient('https://jtknertrqhszjdgmdgzv.supabase.co', serviceKey);

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
