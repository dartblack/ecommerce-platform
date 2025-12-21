<script setup>
import AppLayout from '@/Layouts/AppLayout.vue';
import { Link, router, useForm } from '@inertiajs/vue3';
import { ref, computed } from 'vue';
import DangerButton from '@/Components/DangerButton.vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import TextInput from '@/Components/TextInput.vue';
import InputLabel from '@/Components/InputLabel.vue';
import InputError from '@/Components/InputError.vue';
import ConfirmationModal from '@/Components/ConfirmationModal.vue';
import SecondaryButton from '@/Components/SecondaryButton.vue';

const props = defineProps({
    categories: Object,
    allCategories: Array,
    filters: Object,
});

const searchForm = useForm({
    search: props.filters?.search || '',
    parent_id: props.filters?.parent_id || '',
    is_active: props.filters?.is_active || '',
    trashed: props.filters?.trashed || '',
});

const deleteForm = useForm({});
const restoreForm = useForm({});
const forceDeleteForm = useForm({});
const showDeleteModal = ref(false);
const showRestoreModal = ref(false);
const showForceDeleteModal = ref(false);
const categoryToDelete = ref(null);
const categoryToRestore = ref(null);
const categoryToForceDelete = ref(null);

// Bulk operations
const selectedCategories = ref([]);
const showBulkDeleteModal = ref(false);
const showBulkRestoreModal = ref(false);
const showBulkUpdateModal = ref(false);
const bulkDeleteForm = useForm({ ids: [] });
const bulkRestoreForm = useForm({ ids: [] });
const bulkUpdateForm = useForm({
    ids: [],
    is_active: null,
});

const selectAll = computed({
    get: () => {
        const activeCategories = props.categories.data.filter(c => !isDeleted(c));
        return activeCategories.length > 0 && activeCategories.every(c => selectedCategories.value.includes(c.id));
    },
    set: (value) => {
        if (value) {
            const activeCategories = props.categories.data.filter(c => !isDeleted(c));
            selectedCategories.value = [...new Set([...selectedCategories.value, ...activeCategories.map(c => c.id)])];
        } else {
            const activeCategoryIds = props.categories.data.filter(c => !isDeleted(c)).map(c => c.id);
            selectedCategories.value = selectedCategories.value.filter(id => !activeCategoryIds.includes(id));
        }
    },
});

const hasSelectedCategories = computed(() => selectedCategories.value.length > 0);

const search = () => {
    searchForm.get(route('admin.categories.index'), {
        preserveState: true,
        preserveScroll: true,
    });
};

const resetFilters = () => {
    // Reset form values
    searchForm.search = '';
    searchForm.parent_id = '';
    searchForm.is_active = '';
    searchForm.trashed = '';
    
    // Navigate to the route without any query parameters
    router.get(route('admin.categories.index'), {}, {
        preserveState: false,
        preserveScroll: false,
        replace: true,
    });
};

const confirmDelete = (category) => {
    categoryToDelete.value = category;
    showDeleteModal.value = true;
};

const deleteCategory = () => {
    if (categoryToDelete.value) {
        deleteForm.delete(route('admin.categories.destroy', categoryToDelete.value.id), {
            preserveScroll: true,
            onSuccess: () => {
                showDeleteModal.value = false;
                categoryToDelete.value = null;
            },
        });
    }
};

const getParentName = (category) => {
    if (!category.parent) return 'Root Category';
    return category.parent.name;
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

const confirmRestore = (category) => {
    categoryToRestore.value = category;
    showRestoreModal.value = true;
};

const restoreCategory = () => {
    if (categoryToRestore.value) {
        restoreForm.post(route('admin.categories.restore', categoryToRestore.value.id), {
            preserveScroll: true,
            onSuccess: () => {
                showRestoreModal.value = false;
                categoryToRestore.value = null;
            },
        });
    }
};

const confirmForceDelete = (category) => {
    categoryToForceDelete.value = category;
    showForceDeleteModal.value = true;
};

const forceDeleteCategory = () => {
    if (categoryToForceDelete.value) {
        forceDeleteForm.delete(route('admin.categories.force-delete', categoryToForceDelete.value.id), {
            preserveScroll: true,
            onSuccess: () => {
                showForceDeleteModal.value = false;
                categoryToForceDelete.value = null;
            },
        });
    }
};

const isDeleted = (category) => {
    return category.deleted_at !== null && category.deleted_at !== undefined;
};

// Bulk operations handlers
const toggleCategorySelection = (categoryId) => {
    const index = selectedCategories.value.indexOf(categoryId);
    if (index > -1) {
        selectedCategories.value.splice(index, 1);
    } else {
        selectedCategories.value.push(categoryId);
    }
};

const isCategorySelected = (categoryId) => {
    return selectedCategories.value.includes(categoryId);
};

const confirmBulkDelete = () => {
    if (selectedCategories.value.length === 0) return;
    bulkDeleteForm.ids = selectedCategories.value;
    showBulkDeleteModal.value = true;
};

const performBulkDelete = () => {
    bulkDeleteForm.post(route('admin.categories.bulk-delete'), {
        preserveScroll: true,
        onSuccess: () => {
            showBulkDeleteModal.value = false;
            selectedCategories.value = [];
            bulkDeleteForm.reset();
        },
    });
};

const confirmBulkRestore = () => {
    if (selectedCategories.value.length === 0) return;
    bulkRestoreForm.ids = selectedCategories.value;
    showBulkRestoreModal.value = true;
};

const performBulkRestore = () => {
    bulkRestoreForm.post(route('admin.categories.bulk-restore'), {
        preserveScroll: true,
        onSuccess: () => {
            showBulkRestoreModal.value = false;
            selectedCategories.value = [];
            bulkRestoreForm.reset();
        },
    });
};

const openBulkUpdateModal = () => {
    if (selectedCategories.value.length === 0) return;
    bulkUpdateForm.ids = selectedCategories.value;
    bulkUpdateForm.is_active = null;
    showBulkUpdateModal.value = true;
};

const performBulkUpdate = () => {
    const data = {
        ids: bulkUpdateForm.ids,
    };
    
    if (bulkUpdateForm.is_active !== null) {
        data.is_active = bulkUpdateForm.is_active === 'true' || bulkUpdateForm.is_active === true;
    }

    bulkUpdateForm.transform(() => data).post(route('admin.categories.bulk-update'), {
        preserveScroll: true,
        onSuccess: () => {
            showBulkUpdateModal.value = false;
            selectedCategories.value = [];
            bulkUpdateForm.reset();
        },
    });
};
</script>

<template>
    <AppLayout title="Category Management">
        <template #header>
            <div class="flex justify-between items-center">
                <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                    Category Management
                </h2>
                <Link :href="route('admin.categories.create')">
                    <PrimaryButton>Create Category</PrimaryButton>
                </Link>
            </div>
        </template>

        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                    <!-- Search and Filter -->
                    <div class="p-6 border-b border-gray-200">
                        <form @submit.prevent="search" class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <InputLabel for="search" value="Search" />
                                    <TextInput
                                        id="search"
                                        v-model="searchForm.search"
                                        type="text"
                                        class="mt-1 block w-full"
                                        placeholder="Search by name or description..."
                                    />
                                </div>
                                <div>
                                    <InputLabel for="parent_id" value="Parent Category" />
                                    <select
                                        id="parent_id"
                                        v-model="searchForm.parent_id"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">All Categories</option>
                                        <option value="null">Root Categories Only</option>
                                        <option
                                            v-for="cat in allCategories"
                                            :key="cat.id"
                                            :value="cat.id"
                                        >
                                            {{ getCategoryPath(cat) }}
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <InputLabel for="is_active" value="Status" />
                                    <select
                                        id="is_active"
                                        v-model="searchForm.is_active"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">All Statuses</option>
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

                    <!-- Bulk Actions Bar -->
                    <div v-if="hasSelectedCategories" class="px-6 py-3 bg-indigo-50 border-b border-indigo-200 flex items-center justify-between">
                        <div class="text-sm text-indigo-900">
                            <strong>{{ selectedCategories.length }}</strong> category(ies) selected
                        </div>
                        <div class="flex gap-2">
                            <template v-if="searchForm.trashed !== 'only'">
                                <SecondaryButton @click="openBulkUpdateModal" size="sm">
                                    Update
                                </SecondaryButton>
                                <DangerButton @click="confirmBulkDelete" size="sm">
                                    Delete
                                </DangerButton>
                            </template>
                            <template v-else>
                                <PrimaryButton @click="confirmBulkRestore" size="sm">
                                    Restore
                                </PrimaryButton>
                            </template>
                            <SecondaryButton @click="selectedCategories = []" size="sm">
                                Clear Selection
                            </SecondaryButton>
                        </div>
                    </div>

                    <!-- Categories Table -->
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
                                        Name
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Slug
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Parent
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
                                <tr
                                    v-for="category in categories.data"
                                    :key="category.id"
                                    :class="{ 'opacity-60': isDeleted(category), 'bg-indigo-50': isCategorySelected(category.id) }"
                                >
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <input
                                            v-if="!isDeleted(category) || searchForm.trashed === 'only'"
                                            type="checkbox"
                                            :checked="isCategorySelected(category.id)"
                                            @change="toggleCategorySelection(category.id)"
                                            class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm font-medium" :class="isDeleted(category) ? 'text-gray-500' : 'text-gray-900'">
                                            {{ category.name }}
                                            <span v-if="isDeleted(category)" class="ml-2 text-xs text-red-600">(Deleted)</span>
                                        </div>
                                        <div v-if="category.description" class="text-xs text-gray-500 mt-1">
                                            {{ category.description.substring(0, 50) }}{{ category.description.length > 50 ? '...' : '' }}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm text-gray-500">
                                            {{ category.slug }}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm text-gray-500">
                                            {{ getParentName(category) }}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span
                                            :class="[
                                                'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                                                getStatusBadgeClass(category.is_active),
                                            ]"
                                        >
                                            {{ category.is_active ? 'Active' : 'Inactive' }}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {{ category.sort_order }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <template v-if="!isDeleted(category)">
                                            <Link
                                                :href="route('admin.categories.show', category.id)"
                                                class="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                View
                                            </Link>
                                            <Link
                                                :href="route('admin.categories.edit', category.id)"
                                                class="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                @click="confirmDelete(category)"
                                                class="text-red-600 hover:text-red-900"
                                                :disabled="!category.can_be_deleted"
                                            >
                                                Delete
                                            </button>
                                        </template>
                                        <template v-else>
                                            <button
                                                @click="confirmRestore(category)"
                                                class="text-green-600 hover:text-green-900 mr-4"
                                            >
                                                Restore
                                            </button>
                                            <button
                                                @click="confirmForceDelete(category)"
                                                class="text-red-600 hover:text-red-900"
                                                :disabled="!category.can_be_deleted"
                                            >
                                                Permanently Delete
                                            </button>
                                        </template>
                                    </td>
                                </tr>
                                <tr v-if="categories.data.length === 0">
                                    <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">
                                        No categories found.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    <div v-if="categories.links" class="px-6 py-4 border-t border-gray-200">
                        <div class="flex items-center justify-between">
                            <div class="text-sm text-gray-700">
                                Showing {{ categories.from }} to {{ categories.to }} of {{ categories.total }} results
                            </div>
                            <div class="flex gap-2">
                                <template v-for="(link, index) in categories.links" :key="index">
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
            <template #title> Delete Category </template>

            <template #content>
                Are you sure you want to delete "{{ categoryToDelete?.name }}"? This category will be moved to trash and can be restored later.
                <span v-if="categoryToDelete && !categoryToDelete.can_be_deleted" class="block mt-2 text-red-600">
                    This category has child categories and cannot be deleted.
                </span>
            </template>

            <template #footer>
                <SecondaryButton @click="showDeleteModal = false"> Cancel </SecondaryButton>

                <DangerButton
                    class="ml-3"
                    :class="{ 'opacity-25': deleteForm.processing }"
                    :disabled="deleteForm.processing || (categoryToDelete && !categoryToDelete.can_be_deleted)"
                    @click="deleteCategory"
                >
                    Delete Category
                </DangerButton>
            </template>
        </ConfirmationModal>

        <!-- Restore Confirmation Modal -->
        <ConfirmationModal :show="showRestoreModal" @close="showRestoreModal = false">
            <template #title> Restore Category </template>

            <template #content>
                Are you sure you want to restore "{{ categoryToRestore?.name }}"? This will make the category active again.
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
                Are you sure you want to permanently delete "{{ categoryToForceDelete?.name }}"? This will permanently remove the category from the database.
                <span v-if="categoryToForceDelete && !categoryToForceDelete.can_be_deleted" class="block mt-2 text-red-600">
                    This category has child categories and cannot be permanently deleted.
                </span>
            </template>

            <template #footer>
                <SecondaryButton @click="showForceDeleteModal = false"> Cancel </SecondaryButton>

                <DangerButton
                    class="ml-3"
                    :class="{ 'opacity-25': forceDeleteForm.processing }"
                    :disabled="forceDeleteForm.processing || (categoryToForceDelete && !categoryToForceDelete.can_be_deleted)"
                    @click="forceDeleteCategory"
                >
                    Permanently Delete
                </DangerButton>
            </template>
        </ConfirmationModal>

        <!-- Bulk Delete Confirmation Modal -->
        <ConfirmationModal :show="showBulkDeleteModal" @close="showBulkDeleteModal = false">
            <template #title> Delete Selected Categories </template>

            <template #content>
                Are you sure you want to delete <strong>{{ bulkDeleteForm.ids.length }}</strong> selected category(ies)? These categories will be moved to trash and can be restored later. Categories with child categories cannot be deleted.
            </template>

            <template #footer>
                <SecondaryButton @click="showBulkDeleteModal = false"> Cancel </SecondaryButton>

                <DangerButton
                    class="ml-3"
                    :class="{ 'opacity-25': bulkDeleteForm.processing }"
                    :disabled="bulkDeleteForm.processing"
                    @click="performBulkDelete"
                >
                    Delete Categories
                </DangerButton>
            </template>
        </ConfirmationModal>

        <!-- Bulk Restore Confirmation Modal -->
        <ConfirmationModal :show="showBulkRestoreModal" @close="showBulkRestoreModal = false">
            <template #title> Restore Selected Categories </template>

            <template #content>
                Are you sure you want to restore <strong>{{ bulkRestoreForm.ids.length }}</strong> selected category(ies)? This will make the categories active again.
            </template>

            <template #footer>
                <SecondaryButton @click="showBulkRestoreModal = false"> Cancel </SecondaryButton>

                <PrimaryButton
                    class="ml-3"
                    :class="{ 'opacity-25': bulkRestoreForm.processing }"
                    :disabled="bulkRestoreForm.processing"
                    @click="performBulkRestore"
                >
                    Restore Categories
                </PrimaryButton>
            </template>
        </ConfirmationModal>

        <!-- Bulk Update Modal -->
        <ConfirmationModal :show="showBulkUpdateModal" @close="showBulkUpdateModal = false">
            <template #title> Update Selected Categories </template>

            <template #content>
                <div class="space-y-4">
                    <p class="text-sm text-gray-600">
                        Update <strong>{{ bulkUpdateForm.ids.length }}</strong> selected category(ies). Leave fields empty to skip updating them.
                    </p>
                    
                    <div>
                        <InputLabel for="bulk_is_active" value="Active Status" />
                        <select
                            id="bulk_is_active"
                            v-model="bulkUpdateForm.is_active"
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option :value="null">No Change</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
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
                    Update Categories
                </PrimaryButton>
            </template>
        </ConfirmationModal>
    </AppLayout>
</template>

