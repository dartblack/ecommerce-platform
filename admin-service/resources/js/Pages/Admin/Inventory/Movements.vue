<script setup>
import AppLayout from '@/Layouts/AppLayout.vue';
import { Link, router, useForm } from '@inertiajs/vue3';
import TextInput from '@/Components/TextInput.vue';
import InputLabel from '@/Components/InputLabel.vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import SecondaryButton from '@/Components/SecondaryButton.vue';

const props = defineProps({
    movements: Object,
    products: Array,
    filters: Object,
});

const searchForm = useForm({
    product_id: props.filters?.product_id || '',
    type: props.filters?.type || '',
    date_from: props.filters?.date_from || '',
    date_to: props.filters?.date_to || '',
});

const search = () => {
    searchForm.get(route('admin.inventory.movements'), {
        preserveState: true,
        preserveScroll: true,
    });
};

const resetFilters = () => {
    searchForm.product_id = '';
    searchForm.type = '';
    searchForm.date_from = '';
    searchForm.date_to = '';
    
    router.get(route('admin.inventory.movements'), {}, {
        preserveState: false,
        preserveScroll: false,
        replace: true,
    });
};

const getMovementTypeBadgeClass = (type) => {
    const classes = {
        'adjustment': 'bg-blue-100 text-blue-800',
        'sale': 'bg-green-100 text-green-800',
        'return': 'bg-purple-100 text-purple-800',
        'damage': 'bg-red-100 text-red-800',
        'transfer_in': 'bg-indigo-100 text-indigo-800',
        'transfer_out': 'bg-orange-100 text-orange-800',
        'initial_stock': 'bg-gray-100 text-gray-800',
    };
    return classes[type] || 'bg-gray-100 text-gray-800';
};

const formatDate = (date) => {
    return new Date(date).toLocaleString();
};
</script>

<template>
    <AppLayout title="Inventory Movement History">
        <template #header>
            <div class="flex justify-between items-center">
                <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                    Inventory Movement History
                </h2>
                <Link :href="route('admin.inventory.index')">
                    <SecondaryButton>Back to Inventory</SecondaryButton>
                </Link>
            </div>
        </template>

        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                    <!-- Search and Filter -->
                    <div class="p-6 border-b border-gray-200">
                        <form @submit.prevent="search" class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <InputLabel for="product_id" value="Product" />
                                    <select
                                        id="product_id"
                                        v-model="searchForm.product_id"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">All Products</option>
                                        <option
                                            v-for="product in products"
                                            :key="product.id"
                                            :value="product.id"
                                        >
                                            {{ product.name }} ({{ product.sku }})
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <InputLabel for="type" value="Movement Type" />
                                    <select
                                        id="type"
                                        v-model="searchForm.type"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">All Types</option>
                                        <option value="adjustment">Stock Adjustment</option>
                                        <option value="sale">Sale</option>
                                        <option value="return">Return</option>
                                        <option value="damage">Damage/Loss</option>
                                        <option value="transfer_in">Transfer In</option>
                                        <option value="transfer_out">Transfer Out</option>
                                        <option value="initial_stock">Initial Stock</option>
                                    </select>
                                </div>
                                <div>
                                    <InputLabel for="date_from" value="Date From" />
                                    <TextInput
                                        id="date_from"
                                        v-model="searchForm.date_from"
                                        type="date"
                                        class="mt-1 block w-full"
                                    />
                                </div>
                                <div>
                                    <InputLabel for="date_to" value="Date To" />
                                    <TextInput
                                        id="date_to"
                                        v-model="searchForm.date_to"
                                        type="date"
                                        class="mt-1 block w-full"
                                    />
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <PrimaryButton type="submit" :disabled="searchForm.processing">
                                    Search
                                </PrimaryButton>
                                <SecondaryButton type="button" @click="resetFilters">
                                    Reset
                                </SecondaryButton>
                            </div>
                        </form>
                    </div>

                    <!-- Movements Table -->
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Change
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stock Level
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Reason
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr v-for="movement in movements.data" :key="movement.id">
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm text-gray-900">
                                            {{ formatDate(movement.created_at) }}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="text-sm font-medium text-gray-900">
                                            {{ movement.product?.name }}
                                        </div>
                                        <div class="text-xs text-gray-500 font-mono">
                                            {{ movement.product?.sku }}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span
                                            :class="[
                                                'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                                                getMovementTypeBadgeClass(movement.type),
                                            ]"
                                        >
                                            {{ movement.type_label }}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div
                                            class="text-sm font-semibold"
                                            :class="{
                                                'text-green-600': movement.quantity_change > 0,
                                                'text-red-600': movement.quantity_change < 0,
                                                'text-gray-600': movement.quantity_change === 0,
                                            }"
                                        >
                                            {{ movement.quantity_change > 0 ? '+' : '' }}{{ movement.quantity_change }}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm text-gray-900">
                                            {{ movement.quantity_before }} → {{ movement.quantity_after }}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="text-sm text-gray-900">
                                            {{ movement.reason || '-' }}
                                        </div>
                                        <div v-if="movement.reference_number" class="text-xs text-gray-500 mt-1">
                                            Ref: {{ movement.reference_number }}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm text-gray-900">
                                            {{ movement.user?.name || 'System' }}
                                        </div>
                                    </td>
                                </tr>
                                <tr v-if="movements.data.length === 0">
                                    <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">
                                        No movements found.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    <div v-if="movements.links" class="px-6 py-4 border-t border-gray-200">
                        <div class="flex items-center justify-between">
                            <div class="text-sm text-gray-700">
                                Showing {{ movements.from }} to {{ movements.to }} of {{ movements.total }} results
                            </div>
                            <div class="flex gap-2">
                                <template v-for="(link, index) in movements.links" :key="index">
                                    <Link
                                        v-if="link.url"
                                        :href="link.url"
                                        v-html="link.label"
                                        :class="[
                                            'px-4 py-2 rounded-md text-sm font-medium',
                                            link.active
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300',
                                        ]"
                                    />
                                    <span
                                        v-else
                                        v-html="link.label"
                                        class="px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-400"
                                    />
                                </template>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

