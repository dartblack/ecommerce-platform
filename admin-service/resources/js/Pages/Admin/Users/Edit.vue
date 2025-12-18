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
    user: Object,
});

const form = useForm({
    name: props.user.name,
    email: props.user.email,
    password: '',
    password_confirmation: '',
    role: props.user.role,
});

const updateUser = () => {
    form.put(route('admin.users.update', props.user.id), {
        preserveScroll: true,
    });
};
</script>

<template>
    <AppLayout title="Edit User">
        <template #header>
            <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                Edit User
            </h2>
        </template>

        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                    <form @submit.prevent="updateUser" class="p-6">
                        <FormSection @submitted="updateUser">
                            <template #title> User Information </template>

                            <template #description>
                                Update the user's account information. Leave password fields blank to
                                keep the current password.
                            </template>

                            <template #form>
                                <!-- Name -->
                                <div class="col-span-6 sm:col-span-4">
                                    <InputLabel for="name" value="Name" />
                                    <TextInput
                                        id="name"
                                        v-model="form.name"
                                        type="text"
                                        class="mt-1 block w-full"
                                        autofocus
                                    />
                                    <InputError :message="form.errors.name" class="mt-2" />
                                </div>

                                <!-- Email -->
                                <div class="col-span-6 sm:col-span-4">
                                    <InputLabel for="email" value="Email" />
                                    <TextInput
                                        id="email"
                                        v-model="form.email"
                                        type="email"
                                        class="mt-1 block w-full"
                                    />
                                    <InputError :message="form.errors.email" class="mt-2" />
                                </div>

                                <!-- Password -->
                                <div class="col-span-6 sm:col-span-4">
                                    <InputLabel for="password" value="Password" />
                                    <TextInput
                                        id="password"
                                        v-model="form.password"
                                        type="password"
                                        class="mt-1 block w-full"
                                    />
                                    <InputError :message="form.errors.password" class="mt-2" />
                                    <p class="mt-1 text-sm text-gray-500">
                                        Leave blank to keep the current password.
                                    </p>
                                </div>

                                <!-- Password Confirmation -->
                                <div class="col-span-6 sm:col-span-4">
                                    <InputLabel for="password_confirmation" value="Confirm Password" />
                                    <TextInput
                                        id="password_confirmation"
                                        v-model="form.password_confirmation"
                                        type="password"
                                        class="mt-1 block w-full"
                                    />
                                    <InputError
                                        :message="form.errors.password_confirmation"
                                        class="mt-2"
                                    />
                                </div>

                                <!-- Role -->
                                <div class="col-span-6 sm:col-span-4">
                                    <InputLabel for="role" value="Role" />
                                    <select
                                        id="role"
                                        v-model="form.role"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="customer">Customer</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <InputError :message="form.errors.role" class="mt-2" />
                                </div>
                            </template>

                            <template #actions>
                                <Link :href="route('admin.users.index')">
                                    <SecondaryButton>Cancel</SecondaryButton>
                                </Link>

                                <PrimaryButton
                                    :class="{ 'opacity-25': form.processing }"
                                    :disabled="form.processing"
                                >
                                    Update User
                                </PrimaryButton>
                            </template>
                        </FormSection>
                    </form>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

