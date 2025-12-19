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
    category: Object,
    categories: Array,
});

const form = useForm({
    name: props.category.name,
    slug: props.category.slug,
    description: props.category.description || '',
    parent_id: props.category.parent_id,
    is_active: props.category.is_active,
    sort_order: props.category.sort_order,
});

const updateCategory = () => {
    form.put(route('admin.categories.update', props.category.id), {
        preserveScroll: true,
    });
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
    <AppLayout title="Edit Category">
        <template #header>
            <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                Edit Category
            </h2>
        </template>

        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                    <form @submit.prevent="updateCategory" class="p-6">
                        <FormSection @submitted="updateCategory">
                            <template #title> Category Information </template>

                            <template #description>
                                Update the category information. Categories can be nested by selecting a parent category.
                            </template>

                            <template #form>
                                <!-- Name -->
                                <div class="col-span-6 sm:col-span-4">
                                    <InputLabel for="name" value="Name *" />
                                    <TextInput
                                        id="name"
                                        v-model="form.name"
                                        type="text"
                                        class="mt-1 block w-full"
                                        autofocus
                                    />
                                    <InputError :message="form.errors.name" class="mt-2" />
                                </div>

                                <!-- Slug -->
                                <div class="col-span-6 sm:col-span-4">
                                    <InputLabel for="slug" value="Slug" />
                                    <TextInput
                                        id="slug"
                                        v-model="form.slug"
                                        type="text"
                                        class="mt-1 block w-full"
                                    />
                                    <p class="mt-1 text-sm text-gray-500">
                                        Leave empty to auto-generate from name. Must be unique.
                                    </p>
                                    <InputError :message="form.errors.slug" class="mt-2" />
                                </div>

                                <!-- Description -->
                                <div class="col-span-6 sm:col-span-4">
                                    <InputLabel for="description" value="Description" />
                                    <textarea
                                        id="description"
                                        v-model="form.description"
                                        rows="4"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    ></textarea>
                                    <InputError :message="form.errors.description" class="mt-2" />
                                </div>

                                <!-- Parent Category -->
                                <div class="col-span-6 sm:col-span-4">
                                    <InputLabel for="parent_id" value="Parent Category" />
                                    <select
                                        id="parent_id"
                                        v-model="form.parent_id"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option :value="null">None (Root Category)</option>
                                        <option
                                            v-for="category in categories"
                                            :key="category.id"
                                            :value="category.id"
                                        >
                                            {{ getCategoryPath(category) }}
                                        </option>
                                    </select>
                                    <InputError :message="form.errors.parent_id" class="mt-2" />
                                </div>

                                <!-- Is Active -->
                                <div class="col-span-6 sm:col-span-4">
                                    <div class="flex items-center">
                                        <input
                                            id="is_active"
                                            v-model="form.is_active"
                                            type="checkbox"
                                            class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                        <InputLabel for="is_active" value="Active" class="ml-2" />
                                    </div>
                                    <InputError :message="form.errors.is_active" class="mt-2" />
                                </div>

                                <!-- Sort Order -->
                                <div class="col-span-6 sm:col-span-4">
                                    <InputLabel for="sort_order" value="Sort Order" />
                                    <TextInput
                                        id="sort_order"
                                        v-model.number="form.sort_order"
                                        type="number"
                                        min="0"
                                        class="mt-1 block w-full"
                                    />
                                    <p class="mt-1 text-sm text-gray-500">
                                        Lower numbers appear first.
                                    </p>
                                    <InputError :message="form.errors.sort_order" class="mt-2" />
                                </div>
                            </template>

                            <template #actions>
                                <Link :href="route('admin.categories.index')">
                                    <SecondaryButton>Cancel</SecondaryButton>
                                </Link>

                                <PrimaryButton
                                    :class="{ 'opacity-25': form.processing }"
                                    :disabled="form.processing"
                                >
                                    Update Category
                                </PrimaryButton>
                            </template>
                        </FormSection>
                    </form>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

