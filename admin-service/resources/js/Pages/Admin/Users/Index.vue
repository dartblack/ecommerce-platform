<script setup>
import AppLayout from '@/Layouts/AppLayout.vue';
import { Link, router, useForm } from '@inertiajs/vue3';
import { ref } from 'vue';
import DangerButton from '@/Components/DangerButton.vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import TextInput from '@/Components/TextInput.vue';
import InputLabel from '@/Components/InputLabel.vue';
import InputError from '@/Components/InputError.vue';
import ConfirmationModal from '@/Components/ConfirmationModal.vue';

defineProps({
    users: Object,
    filters: Object,
});

const searchForm = useForm({
    search: '',
    role: '',
});

const deleteForm = useForm({});
const showDeleteModal = ref(false);
const userToDelete = ref(null);

const search = () => {
    searchForm.get(route('admin.users.index'), {
        preserveState: true,
        preserveScroll: true,
    });
};

const confirmDelete = (user) => {
    userToDelete.value = user;
    showDeleteModal.value = true;
};

const deleteUser = () => {
    if (userToDelete.value) {
        deleteForm.delete(route('admin.users.destroy', userToDelete.value.id), {
            preserveScroll: true,
            onSuccess: () => {
                showDeleteModal.value = false;
                userToDelete.value = null;
            },
        });
    }
};

const getRoleBadgeClass = (role) => {
    return role === 'admin'
        ? 'bg-purple-100 text-purple-800'
        : 'bg-blue-100 text-blue-800';
};
</script>

<template>
    <AppLayout title="User Management">
        <template #header>
            <div class="flex justify-between items-center">
                <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                    User Management
                </h2>
                <Link :href="route('admin.users.create')">
                    <PrimaryButton>Create User</PrimaryButton>
                </Link>
            </div>
        </template>

        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                    <!-- Search and Filter -->
                    <div class="p-6 border-b border-gray-200">
                        <form @submit.prevent="search" class="flex gap-4 items-end">
                            <div class="flex-1">
                                <InputLabel for="search" value="Search" />
                                <TextInput
                                    id="search"
                                    v-model="searchForm.search"
                                    type="text"
                                    class="mt-1 block w-full"
                                    placeholder="Search by name or email..."
                                />
                            </div>
                            <div>
                                <InputLabel for="role" value="Role" />
                                <select
                                    id="role"
                                    v-model="searchForm.role"
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                >
                                    <option value="">All Roles</option>
                                    <option value="admin">Admin</option>
                                    <option value="customer">Customer</option>
                                </select>
                            </div>
                            <PrimaryButton type="submit" :disabled="searchForm.processing">
                                Search
                            </PrimaryButton>
                        </form>
                    </div>

                    <!-- Users Table -->
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created At
                                    </th>
                                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr v-for="user in users.data" :key="user.id">
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm font-medium text-gray-900">
                                            {{ user.name }}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm text-gray-500">
                                            {{ user.email }}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span
                                            :class="[
                                                'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                                                getRoleBadgeClass(user.role),
                                            ]"
                                        >
                                            {{ user.role }}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {{ new Date(user.created_at).toLocaleDateString() }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link
                                            :href="route('admin.users.show', user.id)"
                                            class="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            View
                                        </Link>
                                        <Link
                                            :href="route('admin.users.edit', user.id)"
                                            class="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            @click="confirmDelete(user)"
                                            class="text-red-600 hover:text-red-900"
                                            :disabled="user.id === $page.props.auth.user.id"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                                <tr v-if="users.data.length === 0">
                                    <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">
                                        No users found.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    <div v-if="users.links" class="px-6 py-4 border-t border-gray-200">
                        <div class="flex items-center justify-between">
                            <div class="text-sm text-gray-700">
                                Showing {{ users.from }} to {{ users.to }} of {{ users.total }} results
                            </div>
                            <div class="flex gap-2">
                                <template v-for="(link, index) in users.links" :key="index">
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
            <template #title> Delete User </template>

            <template #content>
                Are you sure you want to delete this user? This action cannot be undone.
            </template>

            <template #footer>
                <SecondaryButton @click="showDeleteModal = false"> Cancel </SecondaryButton>

                <DangerButton
                    class="ml-3"
                    :class="{ 'opacity-25': deleteForm.processing }"
                    :disabled="deleteForm.processing"
                    @click="deleteUser"
                >
                    Delete User
                </DangerButton>
            </template>
        </ConfirmationModal>
    </AppLayout>
</template>

