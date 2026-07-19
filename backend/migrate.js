// migrate.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_NAME = 'products';
const TEMP_DIR = './temp_images';

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

async function downloadImage(url, filename) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download: ${response.status}`);
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(path.join(TEMP_DIR, filename), Buffer.from(buffer));
}

async function uploadToSupabase(filePath, fileName) {
  const fileBuffer = fs.readFileSync(filePath);
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, fileBuffer, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: true,
    });
  if (error) throw error;
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${fileName}`;
}

async function migrate() {
  console.log('🔍 Fetching products...');
  const { data: products, error } = await supabase
    .from('products')
    .select('id, main_image, name');
  if (error) throw error;

  console.log(`📦 Found ${products.length} products`);

  for (const product of products) {
    if (!product.main_image) {
      console.log(`⏭️ Skipping product ${product.id} – no main_image`);
      continue;
    }
    if (product.main_image.includes(supabaseUrl)) {
      console.log(`⏭️ Skipping product ${product.id} – already on Supabase`);
      continue;
    }

    try {
      const ext = path.extname(product.main_image) || '.jpg';
      const filename = `${product.id}_${Date.now()}${ext}`;
      const localPath = path.join(TEMP_DIR, filename);

      console.log(`⬇️ Downloading ${product.main_image} ...`);
      await downloadImage(product.main_image, filename);

      console.log(`⬆️ Uploading ${filename} to Supabase ...`);
      const publicUrl = await uploadToSupabase(localPath, filename);

      const { error: updateError } = await supabase
        .from('products')
        .update({ main_image: publicUrl })
        .eq('id', product.id);
      if (updateError) throw updateError;

      console.log(`✅ Updated product ${product.id} (${product.name})`);
      fs.unlinkSync(localPath);
    } catch (err) {
      console.error(`❌ Failed for product ${product.id}: ${err.message}`);
    }
  }

  console.log('🎉 Migration complete!');
}

migrate();
