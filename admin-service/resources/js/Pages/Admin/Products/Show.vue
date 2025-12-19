<script setup>
import AppLayout from '@/Layouts/AppLayout.vue';
import { Link, useForm, router } from '@inertiajs/vue3';
import { ref } from 'vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import DangerButton from '@/Components/DangerButton.vue';
import ConfirmationModal from '@/Components/ConfirmationModal.vue';
import SecondaryButton from '@/Components/SecondaryButton.vue';

const props = defineProps({
    product: Object,
    isDeleted: Boolean,
});

const restoreForm = useForm({});
const forceDeleteForm = useForm({});
const showRestoreModal = ref(false);
const showForceDeleteModal = ref(false);

const restoreProduct = () => {
    restoreForm.post(route('admin.products.restore', props.product.id), {
        preserveScroll: true,
        onSuccess: () => {
            showRestoreModal.value = false;
        },
    });
};

const forceDeleteProduct = () => {
    forceDeleteForm.delete(route('admin.products.force-delete', props.product.id), {
        preserveScroll: true,
        onSuccess: () => {
            showForceDeleteModal.value = false;
            router.visit(route('admin.products.index', { trashed: 'only' }));
        },
    });
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
    <AppLayout title="Product Details">
        <template #header>
            <div class="flex justify-between items-center">
                <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                    Product Details
                </h2>
                <div class="flex gap-2">
                    <template v-if="!isDeleted">
                        <Link :href="route('admin.products.edit', product.id)">
                            <button class="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150">
                                Edit
                            </button>
                        </Link>
                    </template>
                    <template v-else>
                        <button
                            @click="showRestoreModal = true"
                            class="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 focus:bg-green-700 active:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        >
                            Restore
                        </button>
                        <button
                            @click="showForceDeleteModal = true"
                            class="inline-flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-red-700 focus:bg-red-700 active:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        >
                            Permanently Delete
                        </button>
                    </template>
                    <Link :href="route('admin.products.index')">
                        <button class="inline-flex items-center px-4 py-2 bg-gray-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 focus:bg-gray-700 active:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition ease-in-out duration-150">
                            Back to List
                        </button>
                    </Link>
                </div>
            </div>
        </template>

        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                    <div class="p-6">
                        <!-- Product Image -->
                        <div v-if="product.image_url" class="mb-6">
                            <img
                                :src="product.image_url"
                                :alt="product.name"
                                class="h-64 w-64 object-cover rounded-lg border border-gray-300"
                            />
                        </div>

                        <!-- Product Information -->
                        <div class="space-y-6">
                            <div>
                                <h3 class="text-lg font-medium text-gray-900 mb-4">Product Information</h3>
                                <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Name</dt>
                                        <dd class="mt-1 text-sm text-gray-900">{{ product.name }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Slug</dt>
                                        <dd class="mt-1 text-sm text-gray-900">{{ product.slug }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">SKU</dt>
                                        <dd class="mt-1 text-sm text-gray-900 font-mono">{{ product.sku }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Category</dt>
                                        <dd class="mt-1 text-sm text-gray-900">
                                            <span v-if="product.category">
                                                <Link
                                                    :href="route('admin.categories.show', product.category.id)"
                                                    class="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    {{ product.category.name }}
                                                </Link>
                                            </span>
                                            <span v-else class="text-gray-400">Uncategorized</span>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Price</dt>
                                        <dd class="mt-1 text-sm text-gray-900 font-semibold">
                                            {{ formatPrice(product.price) }}
                                            <span v-if="product.compare_at_price" class="ml-2 text-gray-500 line-through font-normal">
                                                {{ formatPrice(product.compare_at_price) }}
                                            </span>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Stock Quantity</dt>
                                        <dd class="mt-1 text-sm text-gray-900">{{ product.stock_quantity }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Stock Status</dt>
                                        <dd class="mt-1">
                                            <span
                                                :class="[
                                                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                                                    getStockStatusBadgeClass(product.stock_status),
                                                ]"
                                            >
                                                {{ product.stock_status.replace('_', ' ') }}
                                            </span>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Status</dt>
                                        <dd class="mt-1">
                                            <span
                                                :class="[
                                                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                                                    getStatusBadgeClass(product.is_active),
                                                ]"
                                            >
                                                {{ product.is_active ? 'Active' : 'Inactive' }}
                                            </span>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Sort Order</dt>
                                        <dd class="mt-1 text-sm text-gray-900">{{ product.sort_order }}</dd>
                                    </div>
                                    <div v-if="product.short_description" class="sm:col-span-2">
                                        <dt class="text-sm font-medium text-gray-500">Short Description</dt>
                                        <dd class="mt-1 text-sm text-gray-900">{{ product.short_description }}</dd>
                                    </div>
                                    <div v-if="product.description" class="sm:col-span-2">
                                        <dt class="text-sm font-medium text-gray-500">Description</dt>
                                        <dd class="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{{ product.description }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Created At</dt>
                                        <dd class="mt-1 text-sm text-gray-900">
                                            {{ new Date(product.created_at).toLocaleString() }}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Updated At</dt>
                                        <dd class="mt-1 text-sm text-gray-900">
                                            {{ new Date(product.updated_at).toLocaleString() }}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Restore Confirmation Modal -->
        <ConfirmationModal :show="showRestoreModal" @close="showRestoreModal = false">
            <template #title> Restore Product </template>

            <template #content>
                Are you sure you want to restore "{{ product.name }}"? This will make the product active again.
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
                Are you sure you want to permanently delete "{{ product.name }}"? This will permanently remove the product from the database.
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

