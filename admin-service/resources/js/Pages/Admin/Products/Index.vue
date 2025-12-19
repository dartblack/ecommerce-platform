<script setup>
import AppLayout from '@/Layouts/AppLayout.vue';
import { Link, router, useForm } from '@inertiajs/vue3';
import { ref } from 'vue';
import DangerButton from '@/Components/DangerButton.vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import TextInput from '@/Components/TextInput.vue';
import InputLabel from '@/Components/InputLabel.vue';
import ConfirmationModal from '@/Components/ConfirmationModal.vue';
import SecondaryButton from '@/Components/SecondaryButton.vue';

const props = defineProps({
    products: Object,
    categories: Array,
    filters: Object,
});

const searchForm = useForm({
    search: props.filters?.search || '',
    category_id: props.filters?.category_id || '',
    stock_status: props.filters?.stock_status || '',
    is_active: props.filters?.is_active || '',
    trashed: props.filters?.trashed || '',
});

const deleteForm = useForm({});
const restoreForm = useForm({});
const forceDeleteForm = useForm({});
const showDeleteModal = ref(false);
const showRestoreModal = ref(false);
const showForceDeleteModal = ref(false);
const productToDelete = ref(null);
const productToRestore = ref(null);
const productToForceDelete = ref(null);

const search = () => {
    searchForm.get(route('admin.products.index'), {
        preserveState: true,
        preserveScroll: true,
    });
};

const resetFilters = () => {
    searchForm.search = '';
    searchForm.category_id = '';
    searchForm.stock_status = '';
    searchForm.is_active = '';
    searchForm.trashed = '';
    
    router.get(route('admin.products.index'), {}, {
        preserveState: false,
        preserveScroll: false,
        replace: true,
    });
};

const confirmDelete = (product) => {
    productToDelete.value = product;
    showDeleteModal.value = true;
};

const deleteProduct = () => {
    if (productToDelete.value) {
        deleteForm.delete(route('admin.products.destroy', productToDelete.value.id), {
            preserveScroll: true,
            onSuccess: () => {
                showDeleteModal.value = false;
                productToDelete.value = null;
            },
        });
    }
};

const confirmRestore = (product) => {
    productToRestore.value = product;
    showRestoreModal.value = true;
};

const restoreProduct = () => {
    if (productToRestore.value) {
        restoreForm.post(route('admin.products.restore', productToRestore.value.id), {
            preserveScroll: true,
            onSuccess: () => {
                showRestoreModal.value = false;
                productToRestore.value = null;
            },
        });
    }
};

const confirmForceDelete = (product) => {
    productToForceDelete.value = product;
    showForceDeleteModal.value = true;
};

const forceDeleteProduct = () => {
    if (productToForceDelete.value) {
        forceDeleteForm.delete(route('admin.products.force-delete', productToForceDelete.value.id), {
            preserveScroll: true,
            onSuccess: () => {
                showForceDeleteModal.value = false;
                productToForceDelete.value = null;
            },
        });
    }
};

const isDeleted = (product) => {
    return product.deleted_at !== null && product.deleted_at !== undefined;
};

const getStatusBadgeClass = (isActive) => {
    return isActive
        ? 'bg-green-100 text-green-800'
        : 'bg-gray-100 text-gray-800';
};

const getStockStatusBadgeClass = (status) => {
    const classes = {
        'in_stock': 'bg-green-100 text-green-800',
        'out_of_stock': 'bg-red-100 text-red-800',
        'on_backorder': 'bg-yellow-100 text-yellow-800',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
};

const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(price);
};
</script>

<template>
    <AppLayout title="Product Management">
        <template #header>
            <div class="flex justify-between items-center">
                <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                    Product Management
                </h2>
                <Link :href="route('admin.products.create')">
                    <PrimaryButton>Create Product</PrimaryButton>
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
                                    <InputLabel for="search" value="Search" />
                                    <TextInput
                                        id="search"
                                        v-model="searchForm.search"
                                        type="text"
                                        class="mt-1 block w-full"
                                        placeholder="Search by name, SKU..."
                                    />
                                </div>
                                <div>
                                    <InputLabel for="category_id" value="Category" />
                                    <select
                                        id="category_id"
                                        v-model="searchForm.category_id"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">All Categories</option>
                                        <option
                                            v-for="category in categories"
                                            :key="category.id"
                                            :value="category.id"
                                        >
                                            {{ category.name }}
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <InputLabel for="stock_status" value="Stock Status" />
                                    <select
                                        id="stock_status"
                                        v-model="searchForm.stock_status"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="in_stock">In Stock</option>
                                        <option value="out_of_stock">Out of Stock</option>
                                        <option value="on_backorder">On Backorder</option>
                                    </select>
                                </div>
                                <div>
                                    <InputLabel for="is_active" value="Active Status" />
                                    <select
                                        id="is_active"
                                        v-model="searchForm.is_active"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">All</option>
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>
                                <div>
                                    <InputLabel for="trashed" value="Deleted Status" />
                                    <select
                                        id="trashed"
                                        v-model="searchForm.trashed"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">Active Only</option>
                                        <option value="with">All (Including Deleted)</option>
                                        <option value="only">Deleted Only</option>
                                    </select>
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

                    <!-- Products Table -->
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Image
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        SKU
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stock
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr
                                    v-for="product in products.data"
                                    :key="product.id"
                                    :class="{ 'opacity-60': isDeleted(product) }"
                                >
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <img
                                            v-if="product.image_url"
                                            :src="product.image_url"
                                            :alt="product.name"
                                            class="h-12 w-12 object-cover rounded"
                                        />
                                        <div
                                            v-else
                                            class="h-12 w-12 bg-gray-200 rounded flex items-center justify-center"
                                        >
                                            <span class="text-gray-400 text-xs">No Image</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="text-sm font-medium" :class="isDeleted(product) ? 'text-gray-500' : 'text-gray-900'">
                                            {{ product.name }}
                                            <span v-if="isDeleted(product)" class="ml-2 text-xs text-red-600">(Deleted)</span>
                                        </div>
                                        <div v-if="product.short_description" class="text-xs text-gray-500 mt-1">
                                            {{ product.short_description.substring(0, 50) }}{{ product.short_description.length > 50 ? '...' : '' }}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm text-gray-500">
                                            {{ product.sku }}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm text-gray-500">
                                            {{ product.category?.name || 'Uncategorized' }}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm text-gray-900 font-medium">
                                            {{ formatPrice(product.price) }}
                                        </div>
                                        <div v-if="product.compare_at_price" class="text-xs text-gray-500 line-through">
                                            {{ formatPrice(product.compare_at_price) }}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm text-gray-900">
                                            {{ product.stock_quantity }}
                                        </div>
                                        <span
                                            :class="[
                                                'px-2 inline-flex text-xs leading-5 font-semibold rounded-full mt-1',
                                                getStockStatusBadgeClass(product.stock_status),
                                            ]"
                                        >
                                            {{ product.stock_status.replace('_', ' ') }}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span
                                            :class="[
                                                'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                                                getStatusBadgeClass(product.is_active),
                                            ]"
                                        >
                                            {{ product.is_active ? 'Active' : 'Inactive' }}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <template v-if="!isDeleted(product)">
                                            <Link
                                                :href="route('admin.products.show', product.id)"
                                                class="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                View
                                            </Link>
                                            <Link
                                                :href="route('admin.products.edit', product.id)"
                                                class="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                @click="confirmDelete(product)"
                                                class="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </template>
                                        <template v-else>
                                            <button
                                                @click="confirmRestore(product)"
                                                class="text-green-600 hover:text-green-900 mr-4"
                                            >
                                                Restore
                                            </button>
                                            <button
                                                @click="confirmForceDelete(product)"
                                                class="text-red-600 hover:text-red-900"
                                            >
                                                Permanently Delete
                                            </button>
                                        </template>
                                    </td>
                                </tr>
                                <tr v-if="products.data.length === 0">
                                    <td colspan="8" class="px-6 py-4 text-center text-sm text-gray-500">
                                        No products found.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    <div v-if="products.links" class="px-6 py-4 border-t border-gray-200">
                        <div class="flex items-center justify-between">
                            <div class="text-sm text-gray-700">
                                Showing {{ products.from }} to {{ products.to }} of {{ products.total }} results
                            </div>
                            <div class="flex gap-2">
                                <template v-for="(link, index) in products.links" :key="index">
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

        <!-- Delete Confirmation Modal -->
        <ConfirmationModal :show="showDeleteModal" @close="showDeleteModal = false">
            <template #title> Delete Product </template>

            <template #content>
                Are you sure you want to delete "{{ productToDelete?.name }}"? This product will be moved to trash and can be restored later.
            </template>

            <template #footer>
                <SecondaryButton @click="showDeleteModal = false"> Cancel </SecondaryButton>

                <DangerButton
                    class="ml-3"
                    :class="{ 'opacity-25': deleteForm.processing }"
                    :disabled="deleteForm.processing"
                    @click="deleteProduct"
                >
                    Delete Product
                </DangerButton>
            </template>
        </ConfirmationModal>

        <!-- Restore Confirmation Modal -->
        <ConfirmationModal :show="showRestoreModal" @close="showRestoreModal = false">
            <template #title> Restore Product </template>

            <template #content>
                Are you sure you want to restore "{{ productToRestore?.name }}"? This will make the product active again.
            </template>

            <template #footer>
                <SecondaryButton @click="showRestoreModal = false"> Cancel </SecondaryButton>

                <PrimaryButton
                    class="ml-3"
                    :class="{ 'opacity-25': restoreForm.processing }"
                    :disabled="restoreForm.processing"
                    @click="restoreProduct"
                >
                    Restore Product
                </PrimaryButton>
            </template>
        </ConfirmationModal>

        <!-- Force Delete Confirmation Modal -->
        <ConfirmationModal :show="showForceDeleteModal" @close="showForceDeleteModal = false">
            <template #title> Permanently Delete Product </template>

            <template #content>
                <div class="text-red-600 font-semibold mb-2">
                    WARNING: This action cannot be undone!
                </div>
                Are you sure you want to permanently delete "{{ productToForceDelete?.name }}"? This will permanently remove the product from the database.
            </template>

            <template #footer>
                <SecondaryButton @click="showForceDeleteModal = false"> Cancel </SecondaryButton>

                <DangerButton
                    class="ml-3"
                    :class="{ 'opacity-25': forceDeleteForm.processing }"
                    :disabled="forceDeleteForm.processing"
                    @click="forceDeleteProduct"
                >
                    Permanently Delete
                </DangerButton>
            </template>
        </ConfirmationModal>
    </AppLayout>
</template>

