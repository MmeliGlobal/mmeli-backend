require('dotenv').config();
const supabase = require('./supabase');

async function seed() {
console.log('Seeding database...');

// Create admin user via email signup
const { data: authData, error: authError } = await supabase.auth.signUp({
email: 'admin@mmeliglobal.com',
password: 'admin123',
});
if (authError) {
console.error('Admin creation error:', authError.message);
} else {
await supabase.from('profiles').insert([{
id: authData.user.id,
name: 'Admin',
surname: 'User',
email: 'admin@mmeliglobal.com',
address: 'Harare, Zimbabwe',
role: 'admin'
}]);
console.log('✅ Admin user created (email: admin@mmeliglobal.com / password: admin123)');
}

// Demo products
const products = [
{
name: "Elegant Leather Tote",
description: "Premium full-grain leather tote bag.",
cat: "Fashion",
subcat: "Handbags",
price: 129.99,
colors: ["Black", "Brown"],
size_options: [{ size: "One Size", price: 129.99 }],
main_image: "https://i.imgur.com/Z1aTPZl.jpeg",
sub_images: []
},
{
name: "iPhone 16e",
description: "Latest iPhone with advanced features.",
cat: "Phones",
subcat: "iPhones",
price: 357,
colors: ["Blue", "Black"],
size_options: [{ size: "128GB", price: 357 }, { size: "256GB", price: 457 }],
main_image: "https://i.imgur.com/9wBjqIU.jpeg",
sub_images: []
}
];

const { error: prodError } = await supabase.from('products').insert(products);
if (prodError) {
console.error('Product insert error:', prodError);
} else {
console.log('✅ Demo products added');
}

console.log('Seeding finished.');
process.exit();
}

seed();