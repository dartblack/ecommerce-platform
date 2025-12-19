<script setup>
import AppLayout from '@/Layouts/AppLayout.vue';
import { Link, useForm } from '@inertiajs/vue3';
import FormSection from '@/Components/FormSection.vue';
import InputError from '@/Components/InputError.vue';
import InputLabel from '@/Components/InputLabel.vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import SecondaryButton from '@/Components/SecondaryButton.vue';
import TextInput from '@/Components/TextInput.vue';

const props = defineProps({
    product: Object,
    recentMovements: Array,
    movementStats: Object,
});

const form = useForm({
    adjustment_type: 'add',
    quantity: 1,
    type: 'adjustment',
    reason: '',
    notes: '',
    reference_number: '',
});

const adjustInventory = () => {
    form.post(route('admin.inventory.adjust', props.product.id), {
        preserveScroll: true,
        onSuccess: () => {
            form.reset();
            form.adjustment_type = 'add';
            form.quantity = 1;
            form.type = 'adjustment';
        },
    });
};

const getStockStatusBadgeClass = (status) => {
    const classes = {
        'in_stock': 'bg-green-100 text-green-800',
        'out_of_stock': 'bg-red-100 text-red-800',
        'on_backorder': 'bg-yellow-100 text-yellow-800',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
};

const getStockLevelClass = (quantity) => {
    if (quantity === 0) return 'text-red-600 font-bold text-2xl';
    if (quantity <= 10) return 'text-yellow-600 font-semibold text-2xl';
    return 'text-green-600 font-semibold text-2xl';
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
    <AppLayout title="Inventory Details">
        <template #header>
            <div class="flex justify-between items-center">
                <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                    Inventory Details: {{ product.name }}
                </h2>
                <Link :href="route('admin.inventory.index')">
                    <SecondaryButton>Back to Inventory</SecondaryButton>
                </Link>
            </div>
        </template>

        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Left Column: Product Info and Adjustment Form -->
                    <div class="lg:col-span-2 space-y-6">
                        <!-- Product Information -->
                        <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                            <div class="p-6">
                                <h3 class="text-lg font-medium text-gray-900 mb-4">Product Information</h3>
                                <dl class="grid grid-cols-2 gap-x-4 gap-y-4">
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Name</dt>
                                        <dd class="mt-1 text-sm text-gray-900">{{ product.name }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">SKU</dt>
                                        <dd class="mt-1 text-sm text-gray-900 font-mono">{{ product.sku }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Category</dt>
                                        <dd class="mt-1 text-sm text-gray-900">
                                            {{ product.category?.name || 'Uncategorized' }}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Status</dt>
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
                                </dl>
                            </div>
                        </div>

                        <!-- Current Stock Level -->
                        <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                            <div class="p-6 text-center">
                                <h3 class="text-sm font-medium text-gray-500 mb-2">Current Stock Level</h3>
                                <div :class="getStockLevelClass(product.stock_quantity)">
                                    {{ product.stock_quantity }}
                                </div>
                            </div>
                        </div>

                        <!-- Adjust Inventory Form -->
                        <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                            <form @submit.prevent="adjustInventory" class="p-6">
                                <FormSection @submitted="adjustInventory">
                                    <template #title> Adjust Inventory </template>

                                    <template #description>
                                        Adjust the stock quantity for this product. All adjustments are logged in the movement history.
                                    </template>

                                    <template #form>
                                        <!-- Adjustment Type -->
                                        <div class="col-span-6 sm:col-span-4">
                                            <InputLabel for="adjustment_type" value="Adjustment Type *" />
                                            <select
                                                id="adjustment_type"
                                                v-model="form.adjustment_type"
                                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                required
                                            >
                                                <option value="add">Add Stock</option>
                                                <option value="remove">Remove Stock</option>
                                                <option value="set">Set Stock Level</option>
                                            </select>
                                            <InputError :message="form.errors.adjustment_type" class="mt-2" />
                                        </div>

                                        <!-- Quantity -->
                                        <div class="col-span-6 sm:col-span-4">
                                            <InputLabel for="quantity" value="Quantity *" />
                                            <TextInput
                                                id="quantity"
                                                v-model.number="form.quantity"
                                                type="number"
                                                min="1"
                                                class="mt-1 block w-full"
                                                required
                                            />
                                            <p class="mt-1 text-sm text-gray-500">
                                                <span v-if="form.adjustment_type === 'add'">
                                                    This will add {{ form.quantity }} to the current stock of {{ product.stock_quantity }}.
                                                </span>
                                                <span v-else-if="form.adjustment_type === 'remove'">
                                                    This will remove {{ form.quantity }} from the current stock of {{ product.stock_quantity }}.
                                                </span>
                                                <span v-else>
                                                    This will set the stock level to {{ form.quantity }} (current: {{ product.stock_quantity }}).
                                                </span>
                                            </p>
                                            <InputError :message="form.errors.quantity" class="mt-2" />
                                        </div>

                                        <!-- Movement Type -->
                                        <div class="col-span-6 sm:col-span-4">
                                            <InputLabel for="type" value="Movement Type *" />
                                            <select
                                                id="type"
                                                v-model="form.type"
                                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                required
                                            >
                                                <option value="adjustment">Stock Adjustment</option>
                                                <option value="sale">Sale</option>
                                                <option value="return">Return</option>
                                                <option value="damage">Damage/Loss</option>
                                                <option value="transfer_in">Transfer In</option>
                                                <option value="transfer_out">Transfer Out</option>
                                                <option value="initial_stock">Initial Stock</option>
                                            </select>
                                            <InputError :message="form.errors.type" class="mt-2" />
                                        </div>

                                        <!-- Reason -->
                                        <div class="col-span-6 sm:col-span-4">
                                            <InputLabel for="reason" value="Reason" />
                                            <TextInput
                                                id="reason"
                                                v-model="form.reason"
                                                type="text"
                                                class="mt-1 block w-full"
                                                placeholder="e.g., Restock, Customer return, etc."
                                            />
                                            <InputError :message="form.errors.reason" class="mt-2" />
                                        </div>

                                        <!-- Reference Number -->
                                        <div class="col-span-6 sm:col-span-4">
                                            <InputLabel for="reference_number" value="Reference Number" />
                                            <TextInput
                                                id="reference_number"
                                                v-model="form.reference_number"
                                                type="text"
                                                class="mt-1 block w-full"
                                                placeholder="e.g., PO-12345, Invoice #456"
                                            />
                                            <InputError :message="form.errors.reference_number" class="mt-2" />
                                        </div>

                                        <!-- Notes -->
                                        <div class="col-span-6 sm:col-span-4">
                                            <InputLabel for="notes" value="Notes" />
                                            <textarea
                                                id="notes"
                                                v-model="form.notes"
                                                rows="3"
                                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                placeholder="Additional notes about this adjustment..."
                                            ></textarea>
                                            <InputError :message="form.errors.notes" class="mt-2" />
                                        </div>
                                    </template>

                                    <template #actions>
                                        <PrimaryButton
                                            :class="{ 'opacity-25': form.processing }"
                                            :disabled="form.processing"
                                        >
                                            Adjust Inventory
                                        </PrimaryButton>
                                    </template>
                                </FormSection>
                            </form>
                        </div>
                    </div>

                    <!-- Right Column: Movement History and Stats -->
                    <div class="space-y-6">
                        <!-- Movement Statistics -->
                        <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                            <div class="p-6">
                                <h3 class="text-lg font-medium text-gray-900 mb-4">Movement Statistics</h3>
                                <dl class="space-y-3">
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Total Additions</dt>
                                        <dd class="mt-1 text-lg font-semibold text-green-600">
                                            +{{ movementStats.total_additions }}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Total Removals</dt>
                                        <dd class="mt-1 text-lg font-semibold text-red-600">
                                            -{{ movementStats.total_removals }}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Total Movements</dt>
                                        <dd class="mt-1 text-lg font-semibold text-gray-900">
                                            {{ movementStats.total_movements }}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        <!-- Recent Movements -->
                        <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                            <div class="p-6">
                                <div class="flex justify-between items-center mb-4">
                                    <h3 class="text-lg font-medium text-gray-900">Recent Movements</h3>
                                    <Link :href="route('admin.inventory.movements', { product_id: product.id })">
                                        <span class="text-sm text-indigo-600 hover:text-indigo-900">View All</span>
                                    </Link>
                                </div>
                                <div class="space-y-3 max-h-96 overflow-y-auto">
                                    <div
                                        v-for="movement in recentMovements"
                                        :key="movement.id"
                                        class="border-l-4 pl-4 py-2"
                                        :class="{
                                            'border-green-500': movement.quantity_change > 0,
                                            'border-red-500': movement.quantity_change < 0,
                                            'border-gray-500': movement.quantity_change === 0,
                                        }"
                                    >
                                        <div class="flex justify-between items-start">
                                            <div class="flex-1">
                                                <div class="flex items-center gap-2">
                                                    <span
                                                        :class="[
                                                            'px-2 py-1 text-xs font-semibold rounded',
                                                            getMovementTypeBadgeClass(movement.type),
                                                        ]"
                                                    >
                                                        {{ movement.type_label }}
                                                    </span>
                                                    <span
                                                        class="text-sm font-semibold"
                                                        :class="{
                                                            'text-green-600': movement.quantity_change > 0,
                                                            'text-red-600': movement.quantity_change < 0,
                                                            'text-gray-600': movement.quantity_change === 0,
                                                        }"
                                                    >
                                                        {{ movement.quantity_change > 0 ? '+' : '' }}{{ movement.quantity_change }}
                                                    </span>
                                                </div>
                                                <div class="text-xs text-gray-500 mt-1">
                                                    {{ movement.quantity_before }} → {{ movement.quantity_after }}
                                                </div>
                                                <div v-if="movement.reason" class="text-xs text-gray-600 mt-1">
                                                    {{ movement.reason }}
                                                </div>
                                                <div class="text-xs text-gray-400 mt-1">
                                                    {{ formatDate(movement.created_at) }}
                                                    <span v-if="movement.user"> by {{ movement.user.name }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-if="recentMovements.length === 0" class="text-sm text-gray-500 text-center py-4">
                                        No movements recorded yet.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

