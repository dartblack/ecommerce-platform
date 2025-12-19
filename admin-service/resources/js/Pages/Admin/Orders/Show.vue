<script setup>
import AppLayout from '@/Layouts/AppLayout.vue';
import { Link, useForm, router } from '@inertiajs/vue3';
import { ref, computed } from 'vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import DangerButton from '@/Components/DangerButton.vue';
import SecondaryButton from '@/Components/SecondaryButton.vue';
import TextInput from '@/Components/TextInput.vue';
import InputLabel from '@/Components/InputLabel.vue';
import ConfirmationModal from '@/Components/ConfirmationModal.vue';

const props = defineProps({
    order: Object,
    isDeleted: Boolean,
});

const statusForm = useForm({
    status: props.order.status,
    payment_status: props.order.payment_status,
    tracking_number: props.order.tracking_number || '',
});

const shipForm = useForm({
    tracking_number: props.order.tracking_number || '',
});

const showCancelModal = ref(false);
const showShipModal = ref(false);

const updateStatus = () => {
    statusForm.put(route('admin.orders.update-status', props.order.id), {
        preserveScroll: true,
        onSuccess: () => {
            // Form will be reset by Inertia
        },
    });
};

const markAsShipped = () => {
    shipForm.post(route('admin.orders.ship', props.order.id), {
        preserveScroll: true,
        onSuccess: () => {
            showShipModal.value = false;
        },
    });
};

const markAsDelivered = () => {
    router.post(route('admin.orders.deliver', props.order.id), {
        preserveScroll: true,
    });
};

const cancelOrder = () => {
    router.post(route('admin.orders.cancel', props.order.id), {
        preserveScroll: true,
        onSuccess: () => {
            showCancelModal.value = false;
        },
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
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const canBeShipped = computed(() => {
    return props.order.status === 'processing' && props.order.payment_status === 'paid';
});

const canBeDelivered = computed(() => {
    return props.order.status === 'shipped';
});

const canBeCancelled = computed(() => {
    return ['pending', 'processing'].includes(props.order.status);
});

const getCustomerName = () => {
    if (props.order.user) {
        return props.order.user.name;
    }
    if (props.order.shipping_first_name || props.order.shipping_last_name) {
        return `${props.order.shipping_first_name || ''} ${props.order.shipping_last_name || ''}`.trim();
    }
    return 'Guest';
};

const getCustomerEmail = () => {
    if (props.order.user) {
        return props.order.user.email;
    }
    return props.order.shipping_email || props.order.billing_email || 'N/A';
};
</script>

<template>
    <AppLayout title="Order Details">
        <template #header>
            <div class="flex justify-between items-center">
                <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                    Order #{{ order.order_number }}
                </h2>
                <div class="flex gap-2">
                    <Link :href="route('admin.orders.index')">
                        <SecondaryButton>Back to Orders</SecondaryButton>
                    </Link>
                </div>
            </div>
        </template>

        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                <!-- Status Management Card -->
                <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                    <div class="p-6 border-b border-gray-200">
                        <h3 class="text-lg font-medium text-gray-900">Order Status Management</h3>
                    </div>
                    <div class="p-6 space-y-6">
                        <!-- Current Status Display -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel value="Current Order Status" />
                                <div class="mt-2">
                                    <span
                                        :class="[
                                            'px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full',
                                            getStatusBadgeClass(order.status),
                                        ]"
                                    >
                                        {{ order.status.charAt(0).toUpperCase() + order.status.slice(1) }}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <InputLabel value="Payment Status" />
                                <div class="mt-2">
                                    <span
                                        :class="[
                                            'px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full',
                                            getPaymentStatusBadgeClass(order.payment_status),
                                        ]"
                                    >
                                        {{ order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1) }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Status Update Form -->
                        <form @submit.prevent="updateStatus" class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <InputLabel for="status" value="Update Order Status" />
                                    <select
                                        id="status"
                                        v-model="statusForm.status"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="refunded">Refunded</option>
                                    </select>
                                </div>
                                <div>
                                    <InputLabel for="payment_status" value="Update Payment Status" />
                                    <select
                                        id="payment_status"
                                        v-model="statusForm.payment_status"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="paid">Paid</option>
                                        <option value="failed">Failed</option>
                                        <option value="refunded">Refunded</option>
                                    </select>
                                </div>
                                <div>
                                    <InputLabel for="tracking_number" value="Tracking Number" />
                                    <TextInput
                                        id="tracking_number"
                                        v-model="statusForm.tracking_number"
                                        type="text"
                                        class="mt-1 block w-full"
                                        placeholder="Enter tracking number"
                                    />
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <PrimaryButton type="submit" :disabled="statusForm.processing">
                                    Update Status
                                </PrimaryButton>
                            </div>
                        </form>

                        <!-- Quick Actions -->
                        <div class="border-t border-gray-200 pt-4">
                            <h4 class="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
                            <div class="flex flex-wrap gap-2">
                                <PrimaryButton
                                    v-if="canBeShipped"
                                    @click="showShipModal = true"
                                    :disabled="shipForm.processing"
                                >
                                    Mark as Shipped
                                </PrimaryButton>
                                <PrimaryButton
                                    v-if="canBeDelivered"
                                    @click="markAsDelivered"
                                >
                                    Mark as Delivered
                                </PrimaryButton>
                                <DangerButton
                                    v-if="canBeCancelled"
                                    @click="showCancelModal = true"
                                >
                                    Cancel Order
                                </DangerButton>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Order Information -->
                <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                    <div class="p-6 border-b border-gray-200">
                        <h3 class="text-lg font-medium text-gray-900">Order Information</h3>
                    </div>
                    <div class="p-6">
                        <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                            <div>
                                <dt class="text-sm font-medium text-gray-500">Order Number</dt>
                                <dd class="mt-1 text-sm text-gray-900 font-mono">{{ order.order_number }}</dd>
                            </div>
                            <div>
                                <dt class="text-sm font-medium text-gray-500">Order Date</dt>
                                <dd class="mt-1 text-sm text-gray-900">{{ formatDate(order.created_at) }}</dd>
                            </div>
                            <div>
                                <dt class="text-sm font-medium text-gray-500">Customer</dt>
                                <dd class="mt-1 text-sm text-gray-900">
                                    {{ getCustomerName() }}
                                    <div class="text-xs text-gray-500 mt-1">{{ getCustomerEmail() }}</div>
                                </dd>
                            </div>
                            <div>
                                <dt class="text-sm font-medium text-gray-500">Payment Method</dt>
                                <dd class="mt-1 text-sm text-gray-900">{{ order.payment_method || 'N/A' }}</dd>
                            </div>
                            <div v-if="order.tracking_number">
                                <dt class="text-sm font-medium text-gray-500">Tracking Number</dt>
                                <dd class="mt-1 text-sm text-gray-900 font-mono">{{ order.tracking_number }}</dd>
                            </div>
                            <div v-if="order.shipped_at">
                                <dt class="text-sm font-medium text-gray-500">Shipped At</dt>
                                <dd class="mt-1 text-sm text-gray-900">{{ formatDate(order.shipped_at) }}</dd>
                            </div>
                            <div v-if="order.delivered_at">
                                <dt class="text-sm font-medium text-gray-500">Delivered At</dt>
                                <dd class="mt-1 text-sm text-gray-900">{{ formatDate(order.delivered_at) }}</dd>
                            </div>
                            <div v-if="order.cancelled_at">
                                <dt class="text-sm font-medium text-gray-500">Cancelled At</dt>
                                <dd class="mt-1 text-sm text-gray-900">{{ formatDate(order.cancelled_at) }}</dd>
                            </div>
                            <div v-if="order.notes" class="sm:col-span-2">
                                <dt class="text-sm font-medium text-gray-500">Notes</dt>
                                <dd class="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{{ order.notes }}</dd>
                            </div>
                        </dl>
                    </div>
                </div>

                <!-- Order Items -->
                <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                    <div class="p-6 border-b border-gray-200">
                        <h3 class="text-lg font-medium text-gray-900">Order Items</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        SKU
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Quantity
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Subtotal
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr v-for="item in (order.order_items || order.orderItems || [])" :key="item.id">
                                    <td class="px-6 py-4">
                                        <div class="text-sm font-medium text-gray-900">
                                            {{ item.product_name }}
                                        </div>
                                        <div v-if="item.product" class="text-xs text-gray-500">
                                            <Link
                                                :href="route('admin.products.show', item.product.id)"
                                                class="text-indigo-600 hover:text-indigo-900"
                                            >
                                                View Product
                                            </Link>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm text-gray-500 font-mono">{{ item.product_sku }}</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm text-gray-900">{{ item.quantity }}</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm text-gray-900">{{ formatPrice(item.price) }}</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right">
                                        <div class="text-sm font-medium text-gray-900">{{ formatPrice(item.subtotal) }}</div>
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot class="bg-gray-50">
                                <tr>
                                    <td colspan="4" class="px-6 py-4 text-right text-sm font-medium text-gray-700">
                                        Subtotal:
                                    </td>
                                    <td class="px-6 py-4 text-right text-sm font-medium text-gray-900">
                                        {{ formatPrice(order.subtotal) }}
                                    </td>
                                </tr>
                                <tr v-if="order.tax > 0">
                                    <td colspan="4" class="px-6 py-4 text-right text-sm font-medium text-gray-700">
                                        Tax:
                                    </td>
                                    <td class="px-6 py-4 text-right text-sm font-medium text-gray-900">
                                        {{ formatPrice(order.tax) }}
                                    </td>
                                </tr>
                                <tr v-if="order.shipping > 0">
                                    <td colspan="4" class="px-6 py-4 text-right text-sm font-medium text-gray-700">
                                        Shipping:
                                    </td>
                                    <td class="px-6 py-4 text-right text-sm font-medium text-gray-900">
                                        {{ formatPrice(order.shipping) }}
                                    </td>
                                </tr>
                                <tr v-if="order.discount > 0">
                                    <td colspan="4" class="px-6 py-4 text-right text-sm font-medium text-gray-700">
                                        Discount:
                                    </td>
                                    <td class="px-6 py-4 text-right text-sm font-medium text-red-600">
                                        -{{ formatPrice(order.discount) }}
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="4" class="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                        Total:
                                    </td>
                                    <td class="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                        {{ formatPrice(order.total) }}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <!-- Addresses -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Shipping Address -->
                    <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                        <div class="p-6 border-b border-gray-200">
                            <h3 class="text-lg font-medium text-gray-900">Shipping Address</h3>
                        </div>
                        <div class="p-6">
                            <div class="text-sm text-gray-900">
                                <div class="font-medium">{{ order.shipping_first_name }} {{ order.shipping_last_name }}</div>
                                <div v-if="order.shipping_email" class="mt-1 text-gray-500">{{ order.shipping_email }}</div>
                                <div v-if="order.shipping_phone" class="mt-1 text-gray-500">{{ order.shipping_phone }}</div>
                                <div class="mt-2">
                                    <div>{{ order.shipping_address_line_1 }}</div>
                                    <div v-if="order.shipping_address_line_2">{{ order.shipping_address_line_2 }}</div>
                                    <div>{{ order.shipping_city }}, {{ order.shipping_state }} {{ order.shipping_postal_code }}</div>
                                    <div>{{ order.shipping_country }}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Billing Address -->
                    <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                        <div class="p-6 border-b border-gray-200">
                            <h3 class="text-lg font-medium text-gray-900">Billing Address</h3>
                        </div>
                        <div class="p-6">
                            <div class="text-sm text-gray-900">
                                <div class="font-medium">{{ order.billing_first_name }} {{ order.billing_last_name }}</div>
                                <div v-if="order.billing_email" class="mt-1 text-gray-500">{{ order.billing_email }}</div>
                                <div v-if="order.billing_phone" class="mt-1 text-gray-500">{{ order.billing_phone }}</div>
                                <div class="mt-2">
                                    <div>{{ order.billing_address_line_1 }}</div>
                                    <div v-if="order.billing_address_line_2">{{ order.billing_address_line_2 }}</div>
                                    <div>{{ order.billing_city }}, {{ order.billing_state }} {{ order.billing_postal_code }}</div>
                                    <div>{{ order.billing_country }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Ship Order Modal -->
        <ConfirmationModal :show="showShipModal" @close="showShipModal = false">
            <template #title>Mark Order as Shipped</template>

            <template #content>
                <div class="space-y-4">
                    <p>Are you sure you want to mark this order as shipped?</p>
                    <div>
                        <InputLabel for="ship_tracking_number" value="Tracking Number (Optional)" />
                        <TextInput
                            id="ship_tracking_number"
                            v-model="shipForm.tracking_number"
                            type="text"
                            class="mt-1 block w-full"
                            placeholder="Enter tracking number"
                        />
                    </div>
                </div>
            </template>

            <template #footer>
                <SecondaryButton @click="showShipModal = false">Cancel</SecondaryButton>
                <PrimaryButton
                    class="ml-3"
                    :class="{ 'opacity-25': shipForm.processing }"
                    :disabled="shipForm.processing"
                    @click="markAsShipped"
                >
                    Mark as Shipped
                </PrimaryButton>
            </template>
        </ConfirmationModal>

        <!-- Cancel Order Modal -->
        <ConfirmationModal :show="showCancelModal" @close="showCancelModal = false">
            <template #title>Cancel Order</template>

            <template #content>
                <div class="text-red-600 font-semibold mb-2">
                    Warning: This action cannot be undone!
                </div>
                <p>Are you sure you want to cancel order #{{ order.order_number }}? This will mark the order as cancelled.</p>
            </template>

            <template #footer>
                <SecondaryButton @click="showCancelModal = false">Cancel</SecondaryButton>
                <DangerButton
                    class="ml-3"
                    @click="cancelOrder"
                >
                    Cancel Order
                </DangerButton>
            </template>
        </ConfirmationModal>
    </AppLayout>
</template>

