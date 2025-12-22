<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Support\Facades\Artisan;

class ProductSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (!Category::exists()) {
            $electronics = Category::create([
                'name' => 'Electronics',
                'slug' => 'electronics',
                'description' => 'Electronic devices and accessories',
                'is_active' => true,
                'sort_order' => 1,
            ]);

            $clothing = Category::create([
                'name' => 'Clothing',
                'slug' => 'clothing',
                'description' => 'Apparel and fashion items',
                'is_active' => true,
                'sort_order' => 2,
            ]);

            $home = Category::create([
                'name' => 'Home & Garden',
                'slug' => 'home-garden',
                'description' => 'Home improvement and garden supplies',
                'is_active' => true,
                'sort_order' => 3,
            ]);

            Category::create([
                'name' => 'Smartphones',
                'slug' => 'smartphones',
                'description' => 'Mobile phones and smartphones',
                'parent_id' => $electronics->id,
                'is_active' => true,
                'sort_order' => 1,
            ]);

            Category::create([
                'name' => 'Laptops',
                'slug' => 'laptops',
                'description' => 'Laptop computers and accessories',
                'parent_id' => $electronics->id,
                'is_active' => true,
                'sort_order' => 2,
            ]);

            Category::create([
                'name' => 'Tablets',
                'slug' => 'tablets',
                'description' => 'Tablet devices',
                'parent_id' => $electronics->id,
                'is_active' => true,
                'sort_order' => 3,
            ]);

            Category::create([
                'name' => 'Men\'s Clothing',
                'slug' => 'mens-clothing',
                'description' => 'Clothing for men',
                'parent_id' => $clothing->id,
                'is_active' => true,
                'sort_order' => 1,
            ]);

            Category::create([
                'name' => 'Women\'s Clothing',
                'slug' => 'womens-clothing',
                'description' => 'Clothing for women',
                'parent_id' => $clothing->id,
                'is_active' => true,
                'sort_order' => 2,
            ]);

            Category::create([
                'name' => 'Furniture',
                'slug' => 'furniture',
                'description' => 'Home furniture and decor',
                'parent_id' => $home->id,
                'is_active' => true,
                'sort_order' => 1,
            ]);

            Category::create([
                'name' => 'Garden Tools',
                'slug' => 'garden-tools',
                'description' => 'Tools and equipment for gardening',
                'parent_id' => $home->id,
                'is_active' => true,
                'sort_order' => 2,
            ]);
        }


        if (Product::exists()) {
            $this->command->info('Products already exist. Skipping product seeding.');
            return;
        }

        $categories = Category::all();

        if ($categories->isEmpty()) {
            $this->command->warn('No categories found. Please run CategorySeeder first.');
            return;
        }

        $products = [
            [
                'name' => 'iPhone 15 Pro',
                'description' => 'The latest iPhone with A17 Pro chip, titanium design, and advanced camera system.',
                'short_description' => 'Latest iPhone with A17 Pro chip',
                'sku' => 'IPHONE-15-PRO-001',
                'price' => 999.99,
                'compare_at_price' => 1099.99,
                'stock_quantity' => 50,
                'stock_status' => 'in_stock',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Samsung Galaxy S24 Ultra',
                'description' => 'Flagship Android smartphone with S Pen, 200MP camera, and Snapdragon 8 Gen 3.',
                'short_description' => 'Flagship Android with S Pen',
                'sku' => 'SAMSUNG-S24-ULTRA-001',
                'price' => 1199.99,
                'compare_at_price' => 1299.99,
                'stock_quantity' => 30,
                'stock_status' => 'in_stock',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Google Pixel 8 Pro',
                'description' => 'Premium Android phone with Google AI features and exceptional camera quality.',
                'short_description' => 'Premium Android with Google AI',
                'sku' => 'GOOGLE-PIXEL-8-PRO-001',
                'price' => 899.99,
                'compare_at_price' => 999.99,
                'stock_quantity' => 25,
                'stock_status' => 'in_stock',
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'MacBook Pro 16" M3 Max',
                'description' => 'Powerful laptop for professionals with M3 Max chip, 16-inch Liquid Retina display.',
                'short_description' => '16" MacBook Pro with M3 Max',
                'sku' => 'MACBOOK-PRO-16-M3-001',
                'price' => 3499.99,
                'compare_at_price' => 3799.99,
                'stock_quantity' => 15,
                'stock_status' => 'in_stock',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Dell XPS 15',
                'description' => 'Premium Windows laptop with Intel Core i9, 15.6" OLED display, and RTX graphics.',
                'short_description' => 'Premium Windows laptop',
                'sku' => 'DELL-XPS-15-001',
                'price' => 2499.99,
                'compare_at_price' => 2799.99,
                'stock_quantity' => 20,
                'stock_status' => 'in_stock',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Lenovo ThinkPad X1 Carbon',
                'description' => 'Business laptop with Intel Core i7, 14" display, and exceptional build quality.',
                'short_description' => 'Business laptop',
                'sku' => 'LENOVO-THINKPAD-X1-001',
                'price' => 1899.99,
                'compare_at_price' => 2099.99,
                'stock_quantity' => 18,
                'stock_status' => 'in_stock',
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'iPad Pro 12.9"',
                'description' => 'Professional tablet with M2 chip, 12.9-inch Liquid Retina XDR display.',
                'short_description' => '12.9" iPad Pro with M2',
                'sku' => 'IPAD-PRO-12.9-001',
                'price' => 1099.99,
                'compare_at_price' => 1199.99,
                'stock_quantity' => 22,
                'stock_status' => 'in_stock',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Samsung Galaxy Tab S9 Ultra',
                'description' => 'Large Android tablet with S Pen, 14.6" display, and Snapdragon 8 Gen 2.',
                'short_description' => 'Large Android tablet',
                'sku' => 'SAMSUNG-TAB-S9-ULTRA-001',
                'price' => 1199.99,
                'compare_at_price' => 1299.99,
                'stock_quantity' => 12,
                'stock_status' => 'in_stock',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Classic White T-Shirt',
                'description' => 'Premium cotton t-shirt, perfect for everyday wear. Comfortable and durable.',
                'short_description' => 'Premium cotton t-shirt',
                'sku' => 'MENS-TSHIRT-WHITE-001',
                'price' => 29.99,
                'compare_at_price' => 39.99,
                'stock_quantity' => 100,
                'stock_status' => 'in_stock',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Slim Fit Jeans',
                'description' => 'Classic slim fit jeans in dark blue. Made from premium denim.',
                'short_description' => 'Slim fit dark blue jeans',
                'sku' => 'MENS-JEANS-SLIM-001',
                'price' => 79.99,
                'compare_at_price' => 99.99,
                'stock_quantity' => 75,
                'stock_status' => 'in_stock',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Floral Summer Dress',
                'description' => 'Beautiful floral print dress perfect for summer occasions. Light and comfortable.',
                'short_description' => 'Floral summer dress',
                'sku' => 'WOMENS-DRESS-FLORAL-001',
                'price' => 59.99,
                'compare_at_price' => 79.99,
                'stock_quantity' => 60,
                'stock_status' => 'in_stock',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'High-Waisted Leggings',
                'description' => 'Comfortable high-waisted leggings perfect for workouts or casual wear.',
                'short_description' => 'High-waisted leggings',
                'sku' => 'WOMENS-LEGGINGS-HIGH-001',
                'price' => 34.99,
                'compare_at_price' => 44.99,
                'stock_quantity' => 80,
                'stock_status' => 'in_stock',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Modern Sofa Set',
                'description' => 'Contemporary 3-seater sofa with matching armchairs. Comfortable and stylish.',
                'short_description' => '3-seater sofa set',
                'sku' => 'FURNITURE-SOFA-SET-001',
                'price' => 1299.99,
                'compare_at_price' => 1599.99,
                'stock_quantity' => 5,
                'stock_status' => 'in_stock',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Oak Dining Table',
                'description' => 'Solid oak dining table seating 6 people. Classic design with modern finish.',
                'short_description' => 'Oak dining table for 6',
                'sku' => 'FURNITURE-TABLE-OAK-001',
                'price' => 899.99,
                'compare_at_price' => 1099.99,
                'stock_quantity' => 8,
                'stock_status' => 'in_stock',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Professional Garden Tool Set',
                'description' => 'Complete set of garden tools including shovel, rake, pruners, and more.',
                'short_description' => 'Complete garden tool set',
                'sku' => 'GARDEN-TOOLS-SET-001',
                'price' => 149.99,
                'compare_at_price' => 199.99,
                'stock_quantity' => 25,
                'stock_status' => 'in_stock',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Electric Lawn Mower',
                'description' => 'Cordless electric lawn mower with battery. Lightweight and eco-friendly.',
                'short_description' => 'Cordless electric lawn mower',
                'sku' => 'GARDEN-MOWER-ELECTRIC-001',
                'price' => 299.99,
                'compare_at_price' => 399.99,
                'stock_quantity' => 10,
                'stock_status' => 'in_stock',
                'is_active' => true,
                'sort_order' => 2,
            ],
        ];

        $categoryMap = [
            'iPhone' => 'Smartphones',
            'Samsung Galaxy S' => 'Smartphones',
            'Google Pixel' => 'Smartphones',
            'MacBook' => 'Laptops',
            'Dell XPS' => 'Laptops',
            'Lenovo ThinkPad' => 'Laptops',
            'iPad' => 'Tablets',
            'Samsung Galaxy Tab' => 'Tablets',
            'MENS-' => 'Men\'s Clothing',
            'WOMENS-' => 'Women\'s Clothing',
            'FURNITURE-' => 'Furniture',
            'GARDEN-' => 'Garden Tools',
        ];

        foreach ($products as $productData) {
            $category = null;
            foreach ($categoryMap as $pattern => $categoryName) {
                if (str_contains($productData['name'], $pattern) || str_contains($productData['sku'], $pattern)) {
                    $category = $categories->firstWhere('name', $categoryName);
                    break;
                }
            }

            if (!$category) {
                $category = $categories->random();
            }

            $slug = Product::generateUniqueSlug($productData['name']);

            Product::create([
                'name' => $productData['name'],
                'slug' => $slug,
                'description' => $productData['description'],
                'short_description' => $productData['short_description'],
                'sku' => $productData['sku'],
                'price' => $productData['price'],
                'compare_at_price' => $productData['compare_at_price'],
                'category_id' => $category?->id,
                'stock_quantity' => $productData['stock_quantity'],
                'stock_status' => $productData['stock_status'],
                'is_active' => $productData['is_active'],
                'image' => null,
                'sort_order' => $productData['sort_order'],
            ]);
        }

        $this->command->info('Successfully seeded ' . count($products) . ' products.');

        // Index products to Elasticsearch
        $this->command->info('Indexing products to Elasticsearch...');
        Artisan::call('elasticsearch:index-products');
        $this->command->info('Products indexed to Elasticsearch successfully.');
    }
}
