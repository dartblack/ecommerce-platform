<script setup>
import AppLayout from '@/Layouts/AppLayout.vue';
import { Link, usePage } from '@inertiajs/vue3';
import { computed } from 'vue';

const page = usePage();

defineProps({
    stats: {
        type: Object,
        default: () => ({
            totalUsers: 0,
            totalAdmins: 0,
            totalCustomers: 0,
        }),
    },
});

const isActive = (routeName) => {
    try {
        const routeUrl = route(routeName);
        return page.url === routeUrl || page.url.startsWith(routeUrl + '/');
    } catch {
        return false;
    }
};

const navigation = computed(() => {
    const items = [
        {
            name: 'Dashboard',
            href: route('admin.dashboard'),
            icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
            active: isActive('admin.dashboard'),
        },
        {
            name: 'Users',
            href: route('admin.users.index'),
            icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
            active: page.url.includes('/admin/users'),
        },
        {
            name: 'Categories',
            href: route('admin.categories.index'),
            icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
            active: page.url.includes('/admin/categories'),
        },
        {
            name: 'Products',
            href: route('admin.products.index'),
            icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
            active: page.url.includes('/admin/products'),
        },
        {
            name: 'Inventory',
            href: route('admin.inventory.index'),
            icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
            active: page.url.includes('/admin/inventory'),
        },
        {
            name: 'Orders',
            href: route('admin.orders.index'),
            icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z',
            active: page.url.includes('/admin/orders'),
        },
        {
            name: 'Sales Reports',
            href: route('admin.sales-reports.index'),
            icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
            active: page.url.includes('/admin/sales-reports'),
        },
        {
            name: 'Profile',
            href: route('profile.show'),
            icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
            active: page.url.includes('/profile'),
        },
    ];

    // Add API Tokens if feature is enabled
    if (page.props.jetstream?.hasApiFeatures) {
        items.push({
            name: 'API Tokens',
            href: route('api-tokens.index'),
            icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
            active: page.url.includes('/api-tokens'),
        });
    }

    return items;
});
</script>

<template>
    <AppLayout title="Admin Dashboard">
        <template #header>
            <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                Admin Dashboard
            </h2>
        </template>

        <div class="flex flex-col lg:flex-row">
            <!-- Sidebar Navigation -->
            <aside class="w-full lg:w-64 bg-white shadow-lg lg:min-h-screen">
                <div class="p-6">
                    <h2 class="text-lg font-semibold text-gray-800 mb-6">Admin Panel</h2>
                    <nav class="space-y-2">
                        <Link
                            v-for="item in navigation"
                            :key="item.name"
                            :href="item.href"
                            :class="[
                                'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                                item.active
                                    ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                            ]"
                        >
                            <svg
                                class="w-5 h-5 mr-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    :d="item.icon"
                                />
                            </svg>
                            {{ item.name }}
                        </Link>
                    </nav>
                </div>
            </aside>

            <!-- Main Content -->
            <div class="flex-1 py-12 px-4 sm:px-6 lg:px-8">
                <div class="max-w-7xl mx-auto">
                    <!-- Stats Cards -->
                    <div class="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
                        <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                            <div class="p-6">
                                <div class="flex items-center">
                                    <div class="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                                        <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                    <div class="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt class="text-sm font-medium text-gray-500 truncate">
                                                Total Users
                                            </dt>
                                            <dd class="text-lg font-medium text-gray-900">
                                                {{ stats.totalUsers }}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                            <div class="p-6">
                                <div class="flex items-center">
                                        <div class="flex-shrink-0 bg-purple-500 rounded-md p-3">
                                        <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <div class="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt class="text-sm font-medium text-gray-500 truncate">
                                            Admins
                                        </dt>
                                        <dd class="text-lg font-medium text-gray-900">
                                            {{ stats.totalAdmins }}
                                        </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                            <div class="p-6">
                                <div class="flex items-center">
                                        <div class="flex-shrink-0 bg-blue-500 rounded-md p-3">
                                        <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <div class="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt class="text-sm font-medium text-gray-500 truncate">
                                                Customers
                                            </dt>
                                            <dd class="text-lg font-medium text-gray-900">
                                                {{ stats.totalCustomers }}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Quick Actions -->
                    <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                        <div class="p-6">
                            <h3 class="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <Link
                                    :href="route('admin.users.index')"
                                    class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                                >
                                    <svg class="h-8 w-8 text-indigo-600 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    <div>
                                        <div class="font-medium text-gray-900">Manage Users</div>
                                        <div class="text-sm text-gray-500">View and manage all users</div>
                                    </div>
                                </Link>

                                <Link
                                    :href="route('admin.users.create')"
                                    class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                                >
                                    <svg class="h-8 w-8 text-green-600 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <div>
                                        <div class="font-medium text-gray-900">Create User</div>
                                        <div class="text-sm text-gray-500">Add a new user to the system</div>
                                    </div>
                                </Link>

                                <Link
                                    :href="route('admin.categories.index')"
                                    class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                                >
                                    <svg class="h-8 w-8 text-orange-600 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    <div>
                                        <div class="font-medium text-gray-900">Manage Categories</div>
                                        <div class="text-sm text-gray-500">View and manage product categories</div>
                                    </div>
                                </Link>

                                <Link
                                    :href="route('admin.products.index')"
                                    class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                                >
                                    <svg class="h-8 w-8 text-blue-600 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    <div>
                                        <div class="font-medium text-gray-900">Manage Products</div>
                                        <div class="text-sm text-gray-500">View and manage all products</div>
                                    </div>
                                </Link>

                                <Link
                                    :href="route('admin.products.create')"
                                    class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                                >
                                    <svg class="h-8 w-8 text-green-600 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <div>
                                        <div class="font-medium text-gray-900">Create Product</div>
                                        <div class="text-sm text-gray-500">Add a new product to the store</div>
                                    </div>
                                </Link>

                                <Link
                                    :href="route('profile.show')"
                                    class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                                >
                                    <svg class="h-8 w-8 text-purple-600 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <div>
                                        <div class="font-medium text-gray-900">My Profile</div>
                                        <div class="text-sm text-gray-500">Update your profile settings</div>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

