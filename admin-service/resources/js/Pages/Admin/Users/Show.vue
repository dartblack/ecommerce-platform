<script setup>
import AppLayout from '@/Layouts/AppLayout.vue';
import { Link } from '@inertiajs/vue3';

defineProps({
    user: Object,
});

const getRoleBadgeClass = (role) => {
    return role === 'admin'
        ? 'bg-purple-100 text-purple-800'
        : 'bg-blue-100 text-blue-800';
};
</script>

<template>
    <AppLayout title="User Details">
        <template #header>
            <div class="flex justify-between items-center">
                <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                    User Details
                </h2>
                <div class="flex gap-2">
                    <Link :href="route('admin.users.edit', user.id)">
                        <button
                            class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                            Edit User
                        </button>
                    </Link>
                    <Link :href="route('admin.users.index')">
                        <button
                            class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                        >
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
                        <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                            <div>
                                <dt class="text-sm font-medium text-gray-500">Name</dt>
                                <dd class="mt-1 text-sm text-gray-900">{{ user.name }}</dd>
                            </div>

                            <div>
                                <dt class="text-sm font-medium text-gray-500">Email</dt>
                                <dd class="mt-1 text-sm text-gray-900">{{ user.email }}</dd>
                            </div>

                            <div>
                                <dt class="text-sm font-medium text-gray-500">Role</dt>
                                <dd class="mt-1">
                                    <span
                                        :class="[
                                            'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                                            getRoleBadgeClass(user.role),
                                        ]"
                                    >
                                        {{ user.role }}
                                    </span>
                                </dd>
                            </div>

                            <div>
                                <dt class="text-sm font-medium text-gray-500">Email Verified</dt>
                                <dd class="mt-1 text-sm text-gray-900">
                                    <span
                                        :class="[
                                            user.email_verified_at
                                                ? 'text-green-600'
                                                : 'text-red-600',
                                        ]"
                                    >
                                        {{ user.email_verified_at ? 'Yes' : 'No' }}
                                    </span>
                                </dd>
                            </div>

                            <div>
                                <dt class="text-sm font-medium text-gray-500">Created At</dt>
                                <dd class="mt-1 text-sm text-gray-900">
                                    {{ new Date(user.created_at).toLocaleString() }}
                                </dd>
                            </div>

                            <div>
                                <dt class="text-sm font-medium text-gray-500">Last Updated</dt>
                                <dd class="mt-1 text-sm text-gray-900">
                                    {{ new Date(user.updated_at).toLocaleString() }}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

