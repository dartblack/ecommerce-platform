<script setup>
import AppLayout from '@/Layouts/AppLayout.vue';
import { Link, useForm, router } from '@inertiajs/vue3';
import { ref } from 'vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import DangerButton from '@/Components/DangerButton.vue';
import ConfirmationModal from '@/Components/ConfirmationModal.vue';
import SecondaryButton from '@/Components/SecondaryButton.vue';

const props = defineProps({
    category: Object,
    isDeleted: Boolean,
});

const restoreForm = useForm({});
const forceDeleteForm = useForm({});
const showRestoreModal = ref(false);
const showForceDeleteModal = ref(false);

const restoreCategory = () => {
    restoreForm.post(route('admin.categories.restore', props.category.id), {
        preserveScroll: true,
        onSuccess: () => {
            showRestoreModal.value = false;
        },
    });
};

const forceDeleteCategory = () => {
    forceDeleteForm.delete(route('admin.categories.force-delete', props.category.id), {
        preserveScroll: true,
        onSuccess: () => {
            showForceDeleteModal.value = false;
            router.visit(route('admin.categories.index', { trashed: 'only' }));
        },
    });
};

const getStatusBadgeClass = (isActive) => {
    return isActive
        ? 'bg-green-100 text-green-800'
        : 'bg-gray-100 text-gray-800';
};

const getCategoryPath = (category) => {
    const path = [category.name];
    let parent = category.parent;
    while (parent) {
        path.unshift(parent.name);
        parent = parent.parent;
    }
    return path.join(' > ');
};
</script>

<template>
    <AppLayout title="Category Details">
        <template #header>
            <div class="flex justify-between items-center">
                <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                    Category Details
                </h2>
                <div class="flex gap-2">
                    <template v-if="!isDeleted">
                        <Link :href="route('admin.categories.edit', category.id)">
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
                    <Link :href="route('admin.categories.index')">
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
                        <!-- Category Information -->
                        <div class="space-y-6">
                            <div>
                                <h3 class="text-lg font-medium text-gray-900 mb-4">Category Information</h3>
                                <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Name</dt>
                                        <dd class="mt-1 text-sm text-gray-900">{{ category.name }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Slug</dt>
                                        <dd class="mt-1 text-sm text-gray-900">{{ category.slug }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Parent Category</dt>
                                        <dd class="mt-1 text-sm text-gray-900">
                                            <span v-if="category.parent">
                                                <Link
                                                    :href="route('admin.categories.show', category.parent.id)"
                                                    class="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    {{ category.parent.name }}
                                                </Link>
                                            </span>
                                            <span v-else class="text-gray-400">Root Category</span>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Full Path</dt>
                                        <dd class="mt-1 text-sm text-gray-900">{{ getCategoryPath(category) }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Status</dt>
                                        <dd class="mt-1">
                                            <span
                                                :class="[
                                                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                                                    getStatusBadgeClass(category.is_active),
                                                ]"
                                            >
                                                {{ category.is_active ? 'Active' : 'Inactive' }}
                                            </span>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Sort Order</dt>
                                        <dd class="mt-1 text-sm text-gray-900">{{ category.sort_order }}</dd>
                                    </div>
                                    <div v-if="category.description" class="sm:col-span-2">
                                        <dt class="text-sm font-medium text-gray-500">Description</dt>
                                        <dd class="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{{ category.description }}</dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Created At</dt>
                                        <dd class="mt-1 text-sm text-gray-900">
                                            {{ new Date(category.created_at).toLocaleString() }}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt class="text-sm font-medium text-gray-500">Updated At</dt>
                                        <dd class="mt-1 text-sm text-gray-900">
                                            {{ new Date(category.updated_at).toLocaleString() }}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <!-- Child Categories -->
                            <div v-if="category.children && category.children.length > 0">
                                <h3 class="text-lg font-medium text-gray-900 mb-4">Child Categories</h3>
                                <div class="overflow-x-auto">
                                    <table class="min-w-full divide-y divide-gray-200">
                                        <thead class="bg-gray-50">
                                            <tr>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Name
                                                </th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Slug
                                                </th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Sort Order
                                                </th>
                                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody class="bg-white divide-y divide-gray-200">
                                            <tr v-for="child in category.children" :key="child.id">
                                                <td class="px-6 py-4 whitespace-nowrap">
                                                    <div class="text-sm font-medium text-gray-900">
                                                        {{ child.name }}
                                                    </div>
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap">
                                                    <div class="text-sm text-gray-500">
                                                        {{ child.slug }}
                                                    </div>
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        :class="[
                                                            'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                                                            getStatusBadgeClass(child.is_active),
                                                        ]"
                                                    >
                                                        {{ child.is_active ? 'Active' : 'Inactive' }}
                                                    </span>
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {{ child.sort_order }}
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <Link
                                                        :href="route('admin.categories.show', child.id)"
                                                        class="text-indigo-600 hover:text-indigo-900 mr-4"
                                                    >
                                                        View
                                                    </Link>
                                                    <Link
                                                        :href="route('admin.categories.edit', child.id)"
                                                        class="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        Edit
                                                    </Link>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div v-else>
                                <h3 class="text-lg font-medium text-gray-900 mb-4">Child Categories</h3>
                                <p class="text-sm text-gray-500">This category has no child categories.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Restore Confirmation Modal -->
        <ConfirmationModal :show="showRestoreModal" @close="showRestoreModal = false">
            <template #title> Restore Category </template>

            <template #content>
                Are you sure you want to restore "{{ category.name }}"? This will make the category active again.
            </template>

            <template #footer>
                <SecondaryButton @click="showRestoreModal = false"> Cancel </SecondaryButton>

                <PrimaryButton
                    class="ml-3"
                    :class="{ 'opacity-25': restoreForm.processing }"
                    :disabled="restoreForm.processing"
                    @click="restoreCategory"
                >
                    Restore Category
                </PrimaryButton>
            </template>
        </ConfirmationModal>

        <!-- Force Delete Confirmation Modal -->
        <ConfirmationModal :show="showForceDeleteModal" @close="showForceDeleteModal = false">
            <template #title> Permanently Delete Category </template>

            <template #content>
                <div class="text-red-600 font-semibold mb-2">
                    WARNING: This action cannot be undone!
                </div>
                Are you sure you want to permanently delete "{{ category.name }}"? This will permanently remove the category from the database.
            </template>

            <template #footer>
                <SecondaryButton @click="showForceDeleteModal = false"> Cancel </SecondaryButton>

                <DangerButton
                    class="ml-3"
                    :class="{ 'opacity-25': forceDeleteForm.processing }"
                    :disabled="forceDeleteForm.processing"
                    @click="forceDeleteCategory"
                >
                    Permanently Delete
                </DangerButton>
            </template>
        </ConfirmationModal>
    </AppLayout>
</template>

