<script setup>
import AppLayout from '@/Layouts/AppLayout.vue';
import { Link, router, useForm } from '@inertiajs/vue3';
import { ref, computed } from 'vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import SecondaryButton from '@/Components/SecondaryButton.vue';
import TextInput from '@/Components/TextInput.vue';
import InputLabel from '@/Components/InputLabel.vue';

const props = defineProps({
    period: String,
    dateFrom: String,
    dateTo: String,
    salesData: Array,
    summary: Object,
});

const filterForm = useForm({
    period: props.period || 'daily',
    date_from: props.dateFrom || '',
    date_to: props.dateTo || '',
});

const applyFilters = () => {
    filterForm.get(route('admin.sales-reports.index'), {
        preserveState: true,
        preserveScroll: true,
    });
};

const resetFilters = () => {
    filterForm.period = 'daily';
    filterForm.date_from = '';
    filterForm.date_to = '';
    
    router.get(route('admin.sales-reports.index'), {
        period: 'daily',
    }, {
        preserveState: false,
        preserveScroll: false,
        replace: true,
    });
};

const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(price);
};

const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
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

// Chart data for revenue
const chartData = computed(() => {
    return {
        labels: props.salesData.map(item => item.label),
        revenues: props.salesData.map(item => item.total_revenue),
        orderCounts: props.salesData.map(item => item.order_count),
    };
});

// Calculate growth percentage
const growthPercentage = computed(() => {
    if (props.salesData.length < 2) return 0;
    
    const first = props.salesData[0].total_revenue;
    const last = props.salesData[props.salesData.length - 1].total_revenue;
    
    if (first === 0) return last > 0 ? 100 : 0;
    
    return ((last - first) / first) * 100;
});

const exportCsv = () => {
    const params = new URLSearchParams({
        period: props.period,
        date_from: props.dateFrom,
        date_to: props.dateTo,
    });
    window.location.href = route('admin.sales-reports.export.csv') + '?' + params.toString();
};

const exportPdf = () => {
    const params = new URLSearchParams({
        period: props.period,
        date_from: props.dateFrom,
        date_to: props.dateTo,
    });
    window.open(route('admin.sales-reports.export.pdf') + '?' + params.toString(), '_blank');
};
</script>

<template>
    <AppLayout title="Sales Reports">
        <template #header>
            <div class="flex justify-between items-center">
                <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                    Sales Reports
                </h2>
                <div class="flex gap-2">
                    <button
                        @click="exportCsv"
                        class="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 focus:bg-green-700 active:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition ease-in-out duration-150"
                    >
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export CSV
                    </button>
                    <button
                        @click="exportPdf"
                        class="inline-flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-red-700 focus:bg-red-700 active:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition ease-in-out duration-150"
                    >
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Export PDF
                    </button>
                    <Link :href="route('admin.orders.index')">
                        <SecondaryButton>View Orders</SecondaryButton>
                    </Link>
                </div>
            </div>
        </template>

        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                <!-- Filters -->
                <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                    <div class="p-6 border-b border-gray-200">
                        <div class="flex justify-between items-center">
                            <h3 class="text-lg font-medium text-gray-900">Report Filters</h3>
                            <div class="flex gap-2">
                                <button
                                    @click="exportCsv"
                                    class="inline-flex items-center px-3 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700 focus:bg-green-700 active:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                >
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    CSV
                                </button>
                                <button
                                    @click="exportPdf"
                                    class="inline-flex items-center px-3 py-2 bg-red-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-red-700 focus:bg-red-700 active:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                >
                                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    PDF
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="p-6">
                        <form @submit.prevent="applyFilters" class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <InputLabel for="period" value="Period" />
                                    <select
                                        id="period"
                                        v-model="filterForm.period"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                                <div>
                                    <InputLabel for="date_from" value="Date From" />
                                    <TextInput
                                        id="date_from"
                                        v-model="filterForm.date_from"
                                        type="date"
                                        class="mt-1 block w-full"
                                    />
                                </div>
                                <div>
                                    <InputLabel for="date_to" value="Date To" />
                                    <TextInput
                                        id="date_to"
                                        v-model="filterForm.date_to"
                                        type="date"
                                        class="mt-1 block w-full"
                                    />
                                </div>
                                <div class="flex items-end">
                                    <div class="flex gap-2 w-full">
                                        <PrimaryButton type="submit" :disabled="filterForm.processing" class="flex-1">
                                            Apply Filters
                                        </PrimaryButton>
                                        <SecondaryButton type="button" @click="resetFilters" class="flex-1">
                                            Reset
                                        </SecondaryButton>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Summary Cards -->
                <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                        <div class="p-6">
                            <div class="flex items-center">
                                <div class="flex-shrink-0 bg-green-500 rounded-md p-3">
                                    <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div class="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt class="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                                        <dd class="text-lg font-medium text-gray-900">
                                            {{ formatPrice(summary.total_revenue) }}
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
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div class="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt class="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                                        <dd class="text-lg font-medium text-gray-900">
                                            {{ formatNumber(summary.total_orders) }}
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
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                                <div class="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt class="text-sm font-medium text-gray-500 truncate">Average Order Value</dt>
                                        <dd class="text-lg font-medium text-gray-900">
                                            {{ formatPrice(summary.average_order_value) }}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                        <div class="p-6">
                            <div class="flex items-center">
                                <div class="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                                    <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                    </svg>
                                </div>
                                <div class="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt class="text-sm font-medium text-gray-500 truncate">Growth</dt>
                                        <dd class="text-lg font-medium" :class="growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'">
                                            {{ growthPercentage >= 0 ? '+' : '' }}{{ growthPercentage.toFixed(1) }}%
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Revenue Breakdown -->
                <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                    <div class="p-6 border-b border-gray-200">
                        <h3 class="text-lg font-medium text-gray-900">Revenue Breakdown</h3>
                    </div>
                    <div class="p-6">
                        <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-4">
                            <div>
                                <dt class="text-sm font-medium text-gray-500">Subtotal</dt>
                                <dd class="mt-1 text-lg font-semibold text-gray-900">
                                    {{ formatPrice(summary.total_subtotal) }}
                                </dd>
                            </div>
                            <div>
                                <dt class="text-sm font-medium text-gray-500">Tax</dt>
                                <dd class="mt-1 text-lg font-semibold text-gray-900">
                                    {{ formatPrice(summary.total_tax) }}
                                </dd>
                            </div>
                            <div>
                                <dt class="text-sm font-medium text-gray-500">Shipping</dt>
                                <dd class="mt-1 text-lg font-semibold text-gray-900">
                                    {{ formatPrice(summary.total_shipping) }}
                                </dd>
                            </div>
                            <div>
                                <dt class="text-sm font-medium text-gray-500">Discount</dt>
                                <dd class="mt-1 text-lg font-semibold text-red-600">
                                    -{{ formatPrice(summary.total_discount) }}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>

                <!-- Sales Data Table -->
                <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                    <div class="p-6 border-b border-gray-200">
                        <h3 class="text-lg font-medium text-gray-900">
                            Sales Data ({{ period.charAt(0).toUpperCase() + period.slice(1) }})
                        </h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Period
                                    </th>
                                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Orders
                                    </th>
                                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Revenue
                                    </th>
                                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Subtotal
                                    </th>
                                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tax
                                    </th>
                                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Shipping
                                    </th>
                                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Discount
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr v-for="item in salesData" :key="item.period">
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm font-medium text-gray-900">{{ item.label }}</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right">
                                        <div class="text-sm text-gray-900">{{ formatNumber(item.order_count) }}</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right">
                                        <div class="text-sm font-semibold text-gray-900">{{ formatPrice(item.total_revenue) }}</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right">
                                        <div class="text-sm text-gray-500">{{ formatPrice(item.total_subtotal) }}</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right">
                                        <div class="text-sm text-gray-500">{{ formatPrice(item.total_tax) }}</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right">
                                        <div class="text-sm text-gray-500">{{ formatPrice(item.total_shipping) }}</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right">
                                        <div class="text-sm text-red-600">{{ formatPrice(item.total_discount) }}</div>
                                    </td>
                                </tr>
                                <tr v-if="salesData.length === 0">
                                    <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">
                                        No sales data found for the selected period.
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot class="bg-gray-50">
                                <tr>
                                    <td class="px-6 py-4 text-left text-sm font-bold text-gray-900">Total</td>
                                    <td class="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                        {{ formatNumber(summary.total_orders) }}
                                    </td>
                                    <td class="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                        {{ formatPrice(summary.total_revenue) }}
                                    </td>
                                    <td class="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                        {{ formatPrice(summary.total_subtotal) }}
                                    </td>
                                    <td class="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                        {{ formatPrice(summary.total_tax) }}
                                    </td>
                                    <td class="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                        {{ formatPrice(summary.total_shipping) }}
                                    </td>
                                    <td class="px-6 py-4 text-right text-sm font-bold text-red-600">
                                        -{{ formatPrice(summary.total_discount) }}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <!-- Order Status Breakdown -->
                <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                    <div class="p-6 border-b border-gray-200">
                        <h3 class="text-lg font-medium text-gray-900">Order Status Breakdown</h3>
                    </div>
                    <div class="p-6">
                        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <div
                                v-for="(count, status) in summary.status_breakdown"
                                :key="status"
                                class="text-center p-4 border border-gray-200 rounded-lg"
                            >
                                <div
                                    :class="[
                                        'px-2 inline-flex text-xs leading-5 font-semibold rounded-full mb-2',
                                        getStatusBadgeClass(status),
                                    ]"
                                >
                                    {{ status.charAt(0).toUpperCase() + status.slice(1) }}
                                </div>
                                <div class="text-2xl font-bold text-gray-900">{{ formatNumber(count) }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

