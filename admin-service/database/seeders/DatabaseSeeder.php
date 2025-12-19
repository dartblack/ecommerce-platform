<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Only create admin user if no admin users exist
        if (!User::where('role', 'admin')->exists()) {
            User::factory()->create([
                'name' => env('ADMIN_NAME', 'Admin User'),
                'email' => env('ADMIN_EMAIL', 'admin@example.com'),
                'password' => Hash::make(env('ADMIN_PASSWORD', 'password')),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]);
        }

        // Create sample categories if none exist
        if (!Category::exists()) {
            // Root categories
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

            // Electronics subcategories
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

            // Clothing subcategories
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

            // Home & Garden subcategories
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
    }
}
