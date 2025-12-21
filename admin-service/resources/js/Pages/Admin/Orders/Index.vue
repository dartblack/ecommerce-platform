<script setup>
import AppLayout from '@/Layouts/AppLayout.vue';
import { Link, router, useForm } from '@inertiajs/vue3';
import { ref, computed } from 'vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import TextInput from '@/Components/TextInput.vue';
import InputLabel from '@/Components/InputLabel.vue';
import SecondaryButton from '@/Components/SecondaryButton.vue';
import DangerButton from '@/Components/DangerButton.vue';
import ConfirmationModal from '@/Components/ConfirmationModal.vue';

const props = defineProps({
    orders: Object,
    customers: Array,
    filters: Object,
});

const searchForm = useForm({
    search: props.filters?.search || '',
    status: props.filters?.status || '',
    payment_status: props.filters?.payment_status || '',
    user_id: props.filters?.user_id || '',
    date_from: props.filters?.date_from || '',
    date_to: props.filters?.date_to || '',
    sort_by: props.filters?.sort_by || 'created_at',
    sort_order: props.filters?.sort_order || 'desc',
    trashed: props.filters?.trashed || '',
});

const search = () => {
    searchForm.get(route('admin.orders.index'), {
        preserveState: true,
        preserveScroll: true,
    });
};

const resetFilters = () => {
    searchForm.search = '';
    searchForm.status = '';
    searchForm.payment_status = '';
    searchForm.user_id = '';
    searchForm.date_from = '';
    searchForm.date_to = '';
    searchForm.sort_by = 'created_at';
    searchForm.sort_order = 'desc';
    searchForm.trashed = '';
    
    router.get(route('admin.orders.index'), {}, {
        preserveState: false,
        preserveScroll: false,
        replace: true,
    });
};

const getStatusBadgeClass = (status) => {
    const classes = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'processing': 'bg-blue-100 text-blue-800',
        'shipped': 'bg-indigo-100 text-indigo-800',
        'delivered': 'bg-green-100 text-green-800',
        'cancelled': 'bg-red-100 text-red-800',
        'refunded': 'bg-gray-100 text-gray-800',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
};

const getPaymentStatusBadgeClass = (status) => {
    const classes = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'paid': 'bg-green-100 text-green-800',
        'failed': 'bg-red-100 text-red-800',
        'refunded': 'bg-gray-100 text-gray-800',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
};

const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(price);
};

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const getCustomerName = (order) => {
    if (order.user) {
        return order.user.name;
    }
    if (order.shipping_first_name || order.shipping_last_name) {
        return `${order.shipping_first_name || ''} ${order.shipping_last_name || ''}`.trim();
    }
    return 'Guest';
};

const getCustomerEmail = (order) => {
    if (order.user) {
        return order.user.email;
    }
    return order.shipping_email || order.billing_email || 'N/A';
};

const isDeleted = (order) => {
    return order.deleted_at !== null && order.deleted_at !== undefined;
};

// Bulk operations
const selectedOrders = ref([]);
const showBulkDeleteModal = ref(false);
const showBulkUpdateModal = ref(false);
const showBulkCancelModal = ref(false);
const bulkDeleteForm = useForm({ ids: [] });
const bulkUpdateForm = useForm({
    ids: [],
    status: null,
    payment_status: null,
});
const bulkCancelForm = useForm({ ids: [] });

const selectAll = computed({
    get: () => {
        const activeOrders = props.orders.data.filter(o => !isDeleted(o));
        return activeOrders.length > 0 && activeOrders.every(o => selectedOrders.value.includes(o.id));
    },
    set: (value) => {
        if (value) {
            const activeOrders = props.orders.data.filter(o => !isDeleted(o));
            selectedOrders.value = [...new Set([...selectedOrders.value, ...activeOrders.map(o => o.id)])];
        } else {
            const activeOrderIds = props.orders.data.filter(o => !isDeleted(o)).map(o => o.id);
            selectedOrders.value = selectedOrders.value.filter(id => !activeOrderIds.includes(id));
        }
    },
});

const hasSelectedOrders = computed(() => selectedOrders.value.length > 0);

// Bulk operations handlers
const toggleOrderSelection = (orderId) => {
    const index = selectedOrders.value.indexOf(orderId);
    if (index > -1) {
        selectedOrders.value.splice(index, 1);
    } else {
        selectedOrders.value.push(orderId);
    }
};

const isOrderSelected = (orderId) => {
    return selectedOrders.value.includes(orderId);
};

const confirmBulkDelete = () => {
    if (selectedOrders.value.length === 0) return;
    bulkDeleteForm.ids = selectedOrders.value;
    showBulkDeleteModal.value = true;
};

const performBulkDelete = () => {
    bulkDeleteForm.post(route('admin.orders.bulk-delete'), {
        preserveScroll: true,
        onSuccess: () => {
            showBulkDeleteModal.value = false;
            selectedOrders.value = [];
            bulkDeleteForm.reset();
        },
    });
};

const openBulkUpdateModal = () => {
    if (selectedOrders.value.length === 0) return;
    bulkUpdateForm.ids = selectedOrders.value;
    bulkUpdateForm.status = null;
    bulkUpdateForm.payment_status = null;
    showBulkUpdateModal.value = true;
};

const performBulkUpdate = () => {
    const data = {
        ids: bulkUpdateForm.ids,
    };
    
    if (bulkUpdateForm.status) {
        data.status = bulkUpdateForm.status;
    }
    if (bulkUpdateForm.payment_status) {
        data.payment_status = bulkUpdateForm.payment_status;
    }

    bulkUpdateForm.transform(() => data).post(route('admin.orders.bulk-update'), {
        preserveScroll: true,
        onSuccess: () => {
            showBulkUpdateModal.value = false;
            selectedOrders.value = [];
            bulkUpdateForm.reset();
        },
    });
};

const confirmBulkCancel = () => {
    if (selectedOrders.value.length === 0) return;
    bulkCancelForm.ids = selectedOrders.value;
    showBulkCancelModal.value = true;
};

const performBulkCancel = () => {
    bulkCancelForm.post(route('admin.orders.bulk-cancel'), {
        preserveScroll: true,
        onSuccess: () => {
            showBulkCancelModal.value = false;
            selectedOrders.value = [];
            bulkCancelForm.reset();
        },
    });
};
</script>

<template>
    <AppLayout title="Order Management">
        <template #header>
            <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                Order Management
            </h2>
        </template>

        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                    <!-- Search and Filter -->
                    <div class="p-6 border-b border-gray-200">
                        <form @submit.prevent="search" class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                <div>
                                    <InputLabel for="search" value="Search" />
                                    <TextInput
                                        id="search"
                                        v-model="searchForm.search"
                                        type="text"
                                        class="mt-1 block w-full"
                                        placeholder="Order number, customer name/email..."
                                    />
                                </div>
                                <div>
                                    <InputLabel for="status" value="Order Status" />
                                    <select
                                        id="status"
                                        v-model="searchForm.status"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="refunded">Refunded</option>
                                    </select>
                                </div>
                                <div>
                                    <InputLabel for="payment_status" value="Payment Status" />
                                    <select
                                        id="payment_status"
                                        v-model="searchForm.payment_status"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">All Payment Statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="failed">Failed</option>
                                        <option value="refunded">Refunded</option>
                                    </select>
                                </div>
                                <div>
                                    <InputLabel for="user_id" value="Customer" />
                                    <select
                                        id="user_id"
                                        v-model="searchForm.user_id"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">All Customers</option>
                                        <option
                                            v-for="customer in customers"
                                            :key="customer.id"
                                            :value="customer.id"
                                        >
                                            {{ customer.name }} ({{ customer.email }})
                                        </option>
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
                                <div>
                                    <InputLabel for="sort_by" value="Sort By" />
                                    <select
                                        id="sort_by"
                                        v-model="searchForm.sort_by"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="created_at">Date</option>
                                        <option value="order_number">Order Number</option>
                                        <option value="total">Total</option>
                                        <option value="status">Status</option>
                                    </select>
                                </div>
                                <div>
                                    <InputLabel for="sort_order" value="Sort Order" />
                                    <select
                                        id="sort_order"
                                        v-model="searchForm.sort_order"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="desc">Descending</option>
                                        <option value="asc">Ascending</option>
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

                    <!-- Bulk Actions Bar -->
                    <div v-if="hasSelectedOrders" class="px-6 py-3 bg-indigo-50 border-b border-indigo-200 flex items-center justify-between">
                        <div class="text-sm text-indigo-900">
                            <strong>{{ selectedOrders.length }}</strong> order(s) selected
                        </div>
                        <div class="flex gap-2">
                            <template v-if="searchForm.trashed !== 'only'">
                                <SecondaryButton @click="openBulkUpdateModal" size="sm">
                                    Update Status
                                </SecondaryButton>
                                <DangerButton @click="confirmBulkCancel" size="sm">
                                    Cancel
                                </DangerButton>
                                <DangerButton @click="confirmBulkDelete" size="sm">
                                    Delete
                                </DangerButton>
                            </template>
                            <SecondaryButton @click="selectedOrders = []" size="sm">
                                Clear Selection
                            </SecondaryButton>
                        </div>
                    </div>

                    <!-- Orders Table -->
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                                        <input
                                            type="checkbox"
                                            :checked="selectAll"
                                            @change="selectAll = $event.target.checked"
                                            class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Order Number
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Items
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Payment
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr
                                    v-for="order in orders.data"
                                    :key="order.id"
                                    :class="{ 'opacity-60': isDeleted(order), 'bg-indigo-50': isOrderSelected(order.id) }"
                                >
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <input
                                            v-if="!isDeleted(order) || searchForm.trashed === 'only'"
                                            type="checkbox"
                                            :checked="isOrderSelected(order.id)"
                                            @change="toggleOrderSelection(order.id)"
                                            class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm font-medium" :class="isDeleted(order) ? 'text-gray-500' : 'text-gray-900'">
                                            {{ order.order_number }}
                                            <span v-if="isDeleted(order)" class="ml-2 text-xs text-red-600">(Deleted)</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="text-sm font-medium text-gray-900">
                                            {{ getCustomerName(order) }}
                                        </div>
                                        <div class="text-xs text-gray-500">
                                            {{ getCustomerEmail(order) }}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm text-gray-900">
                                            {{ (order.order_items || []).length }} item(s)
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm font-medium text-gray-900">
                                            {{ formatPrice(order.total) }}
                                        </div>
                                        <div v-if="order.discount > 0" class="text-xs text-gray-500">
                                            Discount: {{ formatPrice(order.discount) }}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span
                                            :class="[
                                                'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                                                getStatusBadgeClass(order.status),
                                            ]"
                                        >
                                            {{ order.status.charAt(0).toUpperCase() + order.status.slice(1) }}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span
                                            :class="[
                                                'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                                                getPaymentStatusBadgeClass(order.payment_status),
                                            ]"
                                        >
                                            {{ order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1) }}
                                        </span>
                                        <div v-if="order.payment_method" class="text-xs text-gray-500 mt-1">
                                            {{ order.payment_method }}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm text-gray-500">
                                            {{ formatDate(order.created_at) }}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link
                                            :href="route('admin.orders.show', order.id)"
                                            class="text-indigo-600 hover:text-indigo-900"
                                        >
                                            View
                                        </Link>
                                    </td>
                                </tr>
                                <tr v-if="orders.data.length === 0">
                                    <td colspan="9" class="px-6 py-4 text-center text-sm text-gray-500">
                                        No orders found.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    <div v-if="orders.links" class="px-6 py-4 border-t border-gray-200">
                        <div class="flex items-center justify-between">
                            <div class="text-sm text-gray-700">
                                Showing {{ orders.from }} to {{ orders.to }} of {{ orders.total }} results
                            </div>
                            <div class="flex gap-2">
                                <template v-for="(link, index) in orders.links" :key="index">
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

        <!-- Bulk Delete Confirmation Modal -->
        <ConfirmationModal :show="showBulkDeleteModal" @close="showBulkDeleteModal = false">
            <template #title> Delete Selected Orders </template>

            <template #content>
                Are you sure you want to delete <strong>{{ bulkDeleteForm.ids.length }}</strong> selected order(s)? These orders will be moved to trash.
            </template>

            <template #footer>
                <SecondaryButton @click="showBulkDeleteModal = false"> Cancel </SecondaryButton>

                <DangerButton
                    class="ml-3"
                    :class="{ 'opacity-25': bulkDeleteForm.processing }"
                    :disabled="bulkDeleteForm.processing"
                    @click="performBulkDelete"
                >
                    Delete Orders
                </DangerButton>
            </template>
        </ConfirmationModal>

        <!-- Bulk Update Modal -->
        <ConfirmationModal :show="showBulkUpdateModal" @close="showBulkUpdateModal = false">
            <template #title> Update Selected Orders </template>

            <template #content>
                <div class="space-y-4">
                    <p class="text-sm text-gray-600">
                        Update <strong>{{ bulkUpdateForm.ids.length }}</strong> selected order(s). Leave fields empty to skip updating them.
                    </p>
                    
                    <div>
                        <InputLabel for="bulk_status" value="Order Status" />
                        <select
                            id="bulk_status"
                            v-model="bulkUpdateForm.status"
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">No Change</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div>
                        <InputLabel for="bulk_payment_status" value="Payment Status" />
                        <select
                            id="bulk_payment_status"
                            v-model="bulkUpdateForm.payment_status"
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">No Change</option>
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                        </select>
                    </div>
                </div>
            </template>

            <template #footer>
                <SecondaryButton @click="showBulkUpdateModal = false"> Cancel </SecondaryButton>

                <PrimaryButton
                    class="ml-3"
                    :class="{ 'opacity-25': bulkUpdateForm.processing }"
                    :disabled="bulkUpdateForm.processing"
                    @click="performBulkUpdate"
                >
                    Update Orders
                </PrimaryButton>
            </template>
        </ConfirmationModal>

        <!-- Bulk Cancel Confirmation Modal -->
        <ConfirmationModal :show="showBulkCancelModal" @close="showBulkCancelModal = false">
            <template #title> Cancel Selected Orders </template>

            <template #content>
                Are you sure you want to cancel <strong>{{ bulkCancelForm.ids.length }}</strong> selected order(s)? Only pending or processing orders can be cancelled. Orders that cannot be cancelled will be skipped.
            </template>

            <template #footer>
                <SecondaryButton @click="showBulkCancelModal = false"> Cancel </SecondaryButton>

                <DangerButton
                    class="ml-3"
                    :class="{ 'opacity-25': bulkCancelForm.processing }"
                    :disabled="bulkCancelForm.processing"
                    @click="performBulkCancel"
                >
                    Cancel Orders
                </DangerButton>
            </template>
        </ConfirmationModal>
    </AppLayout>
</template>

