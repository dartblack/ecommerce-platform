<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const notifications = ref([]);
const maxNotifications = 5;
const autoRemoveTimeout = 5000; // 5 seconds

const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
        id,
        title: notification.title || 'Notification',
        message: notification.message || '',
        type: notification.type || 'info',
        data: notification.data || null,
        timestamp: notification.timestamp || new Date().toISOString(),
    };

    notifications.value.unshift(newNotification);

    // Keep only the latest notifications
    if (notifications.value.length > maxNotifications) {
        notifications.value = notifications.value.slice(0, maxNotifications);
    }

    // Auto-remove after timeout (except for errors)
    if (newNotification.type !== 'error') {
        setTimeout(() => {
            removeNotification(id);
        }, autoRemoveTimeout);
    }
};

const removeNotification = (id) => {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index > -1) {
        notifications.value.splice(index, 1);
    }
};

const getIcon = (type) => {
    switch (type) {
        case 'success':
            return 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
        case 'error':
            return 'M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
        case 'warning':
            return 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z';
        default:
            return 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z';
    }
};

const getIconColor = (type) => {
    switch (type) {
        case 'success':
            return 'text-green-400';
        case 'error':
            return 'text-red-400';
        case 'warning':
            return 'text-yellow-400';
        default:
            return 'text-blue-400';
    }
};

const getBgColor = (type) => {
    switch (type) {
        case 'success':
            return 'bg-green-50 border-green-200';
        case 'error':
            return 'bg-red-50 border-red-200';
        case 'warning':
            return 'bg-yellow-50 border-yellow-200';
        default:
            return 'bg-blue-50 border-blue-200';
    }
};

onMounted(() => {
    // Listen for general notifications
    if (window.Echo) {
        try {
            window.Echo.private('admin.notifications')
                .listen('.notification.sent', (e) => {
                    addNotification(e);
                });

            // Listen for product events
            window.Echo.private('admin')
                .listen('.product.created', (e) => {
                    addNotification({
                        title: 'Product Created',
                        message: `Product "${e.product.name}" has been created.`,
                        type: 'success',
                        data: e.product,
                    });
                })
                .listen('.product.updated', (e) => {
                    addNotification({
                        title: 'Product Updated',
                        message: `Product "${e.product.name}" has been updated.`,
                        type: 'info',
                        data: e.product,
                    });
                })
                .listen('.product.deleted', (e) => {
                    addNotification({
                        title: 'Product Deleted',
                        message: `Product "${e.product.name}" has been deleted.`,
                        type: 'warning',
                        data: e.product,
                    });
                })
                .listen('.product.restored', (e) => {
                    addNotification({
                        title: 'Product Restored',
                        message: `Product "${e.product.name}" has been restored.`,
                        type: 'success',
                        data: e.product,
                    });
                })
                // Listen for order events
                .listen('.order.created', (e) => {
                    addNotification({
                        title: 'New Order',
                        message: `Order #${e.order.order_number} has been created. Total: $${parseFloat(e.order.total).toFixed(2)}`,
                        type: 'success',
                        data: e.order,
                    });
                })
                .listen('.order.status.changed', (e) => {
                    addNotification({
                        title: 'Order Status Changed',
                        message: `Order #${e.order.order_number} status changed from ${e.order.old_status} to ${e.order.new_status}.`,
                        type: 'info',
                        data: e.order,
                    });
                })
                .listen('.order.shipped', (e) => {
                    const trackingInfo = e.order.tracking_number ? ` Tracking: ${e.order.tracking_number}` : '';
                    addNotification({
                        title: 'Order Shipped',
                        message: `Order #${e.order.order_number} has been shipped.${trackingInfo}`,
                        type: 'success',
                        data: e.order,
                    });
                })
                .listen('.order.delivered', (e) => {
                    addNotification({
                        title: 'Order Delivered',
                        message: `Order #${e.order.order_number} has been delivered.`,
                        type: 'success',
                        data: e.order,
                    });
                })
                .listen('.order.cancelled', (e) => {
                    addNotification({
                        title: 'Order Cancelled',
                        message: `Order #${e.order.order_number} has been cancelled.`,
                        type: 'warning',
                        data: e.order,
                    });
                })
                // Listen for inventory events
                .listen('.inventory.adjusted', (e) => {
                    const changeType = e.movement.quantity_change > 0 ? 'increased' : 'decreased';
                    const changeAmount = Math.abs(e.movement.quantity_change);
                    addNotification({
                        title: 'Inventory Adjusted',
                        message: `Stock for "${e.product.name}" ${changeType} by ${changeAmount}. Current stock: ${e.product.stock_quantity}`,
                        type: 'info',
                        data: { product: e.product, movement: e.movement },
                    });
                })
                .listen('.inventory.low.stock', (e) => {
                    addNotification({
                        title: 'Low Stock Alert',
                        message: `"${e.product.name}" is running low on stock (${e.product.stock_quantity} remaining). Threshold: ${e.threshold}`,
                        type: 'warning',
                        data: { product: e.product, threshold: e.threshold },
                    });
                });
        } catch (error) {
            console.error('Error setting up Echo listeners:', error);
        }
    }
});

onUnmounted(() => {
    if (window.Echo) {
        window.Echo.leave('admin.notifications');
        window.Echo.leave('admin');
    }
});
</script>

<template>
    <div
        aria-live="assertive"
        class="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 z-50"
    >
        <div class="w-full flex flex-col items-center space-y-4">
            <transition-group
                name="notification"
                tag="div"
                class="w-full max-w-sm"
            >
                <div
                    v-for="notification in notifications"
                    :key="notification.id"
                    :class="[
                        'rounded-lg shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden',
                        getBgColor(notification.type)
                    ]"
                >
                    <div class="p-4">
                        <div class="flex items-start">
                            <div class="flex-shrink-0">
                                <svg
                                    class="h-6 w-6"
                                    :class="getIconColor(notification.type)"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke-width="1.5"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        :d="getIcon(notification.type)"
                                    />
                                </svg>
                            </div>
                            <div class="ml-3 w-0 flex-1 pt-0.5">
                                <p class="text-sm font-medium text-gray-900">
                                    {{ notification.title }}
                                </p>
                                <p class="mt-1 text-sm text-gray-500">
                                    {{ notification.message }}
                                </p>
                            </div>
                            <div class="ml-4 flex-shrink-0 flex">
                                <button
                                    @click="removeNotification(notification.id)"
                                    class="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <span class="sr-only">Close</span>
                                    <svg
                                        class="h-5 w-5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </transition-group>
        </div>
    </div>
</template>

<style scoped>
.notification-enter-active,
.notification-leave-active {
    transition: all 0.3s ease;
}

.notification-enter-from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
}

.notification-leave-to {
    opacity: 0;
    transform: translateX(100%);
}

.notification-move {
    transition: transform 0.3s ease;
}
</style>

