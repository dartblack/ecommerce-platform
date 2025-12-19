<script setup>
import AppLayout from '@/Layouts/AppLayout.vue';
import { Link, useForm } from '@inertiajs/vue3';
import { ref } from 'vue';
import FormSection from '@/Components/FormSection.vue';
import InputError from '@/Components/InputError.vue';
import InputLabel from '@/Components/InputLabel.vue';
import PrimaryButton from '@/Components/PrimaryButton.vue';
import SecondaryButton from '@/Components/SecondaryButton.vue';
import TextInput from '@/Components/TextInput.vue';

const props = defineProps({
    categories: Array,
});

const form = useForm({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    sku: '',
    price: '',
    compare_at_price: '',
    category_id: null,
    stock_quantity: 0,
    stock_status: 'in_stock',
    is_active: true,
    image: null,
    sort_order: 0,
});

const imagePreview = ref(null);
const imageInput = ref(null);

const createProduct = () => {
    if (imageInput.value) {
        form.image = imageInput.value.files[0];
    }

    form.post(route('admin.products.store'), {
        preserveScroll: true,
        forceFormData: true,
    });
};

const selectImage = () => {
    imageInput.value.click();
};

const updateImagePreview = () => {
    const image = imageInput.value.files[0];

    if (!image) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        imagePreview.value = e.target.result;
    };

    reader.readAsDataURL(image);
};

const clearImagePreview = () => {
    imagePreview.value = null;
    if (imageInput.value?.value) {
        imageInput.value.value = null;
    }
};
</script>

<template>
    <AppLayout title="Create Product">
        <template #header>
            <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                Create Product
            </h2>
        </template>

        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                    <form @submit.prevent="createProduct" class="p-6">
                        <FormSection @submitted="createProduct">
                            <template #title> Product Information </template>

                            <template #description>
                                Create a new product. Fill in all required fields and upload an image if available.
                            </template>

                            <template #form>
                                <!-- Image -->
                                <div class="col-span-6 sm:col-span-4">
                                    <InputLabel for="image" value="Product Image" />
                                    
                                    <!-- Image File Input -->
                                    <input
                                        id="image"
                                        ref="imageInput"
                                        type="file"
                                        class="hidden"
                                        accept="image/*"
                                        @change="updateImagePreview"
                                    />

                                    <!-- Current Image Preview -->
                                    <div v-show="imagePreview" class="mt-2">
                                        <img
                                            :src="imagePreview"
                                            alt="Product preview"
                                            class="h-48 w-48 object-cover rounded-lg border border-gray-300"
                                        />
                                    </div>

                                    <div v-show="!imagePreview" class="mt-2">
                                        <div class="h-48 w-48 bg-gray-200 rounded-lg border border-gray-300 flex items-center justify-center">
                                            <span class="text-gray-400 text-sm">No image selected</span>
                                        </div>
                                    </div>

                                    <SecondaryButton class="mt-2" type="button" @click.prevent="selectImage">
                                        Select Image
                                    </SecondaryButton>

                                    <SecondaryButton
                                        v-if="imagePreview"
                                        type="button"
                                        class="mt-2 ml-2"
                                        @click.prevent="clearImagePreview"
                                    >
                                        Remove Image
                                    </SecondaryButton>

                                    <p class="mt-1 text-sm text-gray-500">
                                        Recommended: JPEG, PNG, GIF, or WebP (max 2MB)
                                    </p>
                                    <InputError :message="form.errors.image" class="mt-2" />
                                </div>

                                <!-- Name -->
                                <div class="col-span-6 sm:col-span-4">
                                    <InputLabel for="name" value="Name *" />
                                    <TextInput
                                        id="name"
                                        v-model="form.name"
                                        type="text"
                                        class="mt-1 block w-full"
                                        autofocus
                                        required
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
                                        placeholder="Auto-generated from name if left empty"
                                    />
                                    <p class="mt-1 text-sm text-gray-500">
                                        Leave empty to auto-generate from name. Must be unique.
                                    </p>
                                    <InputError :message="form.errors.slug" class="mt-2" />
                                </div>

                                <!-- SKU -->
                                <div class="col-span-6 sm:col-span-4">
                                    <InputLabel for="sku" value="SKU *" />
                                    <TextInput
                                        id="sku"
                                        v-model="form.sku"
                                        type="text"
                                        class="mt-1 block w-full"
                                        required
                                    />
                                    <InputError :message="form.errors.sku" class="mt-2" />
                                </div>

                                <!-- Short Description -->
                                <div class="col-span-6 sm:col-span-4">
                                    <InputLabel for="short_description" value="Short Description" />
                                    <textarea
                                        id="short_description"
                                        v-model="form.short_description"
                                        rows="2"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        maxlength="500"
                                    ></textarea>
                                    <p class="mt-1 text-sm text-gray-500">
                                        Brief description (max 500 characters)
                                    </p>
                                    <InputError :message="form.errors.short_description" class="mt-2" />
                                </div>

                                <!-- Description -->
                                <div class="col-span-6 sm:col-span-4">
                                    <InputLabel for="description" value="Description" />
                                    <textarea
                                        id="description"
                                        v-model="form.description"
                                        rows="6"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    ></textarea>
                                    <InputError :message="form.errors.description" class="mt-2" />
                                </div>

                                <!-- Category -->
                                <div class="col-span-6 sm:col-span-4">
                                    <InputLabel for="category_id" value="Category" />
                                    <select
                                        id="category_id"
                                        v-model="form.category_id"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option :value="null">Uncategorized</option>
                                        <option
                                            v-for="category in categories"
                                            :key="category.id"
                                            :value="category.id"
                                        >
                                            {{ category.name }}
                                        </option>
                                    </select>
                                    <InputError :message="form.errors.category_id" class="mt-2" />
                                </div>

                                <!-- Price -->
                                <div class="col-span-6 sm:col-span-4">
                                    <InputLabel for="price" value="Price *" />
                                    <TextInput
                                        id="price"
                                        v-model="form.price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        class="mt-1 block w-full"
                                        required
                                    />
                                    <InputError :message="form.errors.price" class="mt-2" />
                                </div>

                                <!-- Compare At Price -->
                                <div class="col-span-6 sm:col-span-4">
                                    <InputLabel for="compare_at_price" value="Compare At Price" />
                                    <TextInput
                                        id="compare_at_price"
                                        v-model="form.compare_at_price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        class="mt-1 block w-full"
                                    />
                                    <p class="mt-1 text-sm text-gray-500">
                                        Original price (for showing discounts)
                                    </p>
                                    <InputError :message="form.errors.compare_at_price" class="mt-2" />
                                </div>

                                <!-- Stock Quantity -->
                                <div class="col-span-6 sm:col-span-4">
                                    <InputLabel for="stock_quantity" value="Stock Quantity" />
                                    <TextInput
                                        id="stock_quantity"
                                        v-model.number="form.stock_quantity"
                                        type="number"
                                        min="0"
                                        class="mt-1 block w-full"
                                    />
                                    <InputError :message="form.errors.stock_quantity" class="mt-2" />
                                </div>

                                <!-- Stock Status -->
                                <div class="col-span-6 sm:col-span-4">
                                    <InputLabel for="stock_status" value="Stock Status" />
                                    <select
                                        id="stock_status"
                                        v-model="form.stock_status"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="in_stock">In Stock</option>
                                        <option value="out_of_stock">Out of Stock</option>
                                        <option value="on_backorder">On Backorder</option>
                                    </select>
                                    <InputError :message="form.errors.stock_status" class="mt-2" />
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
                                        Lower numbers appear first. Default: 0
                                    </p>
                                    <InputError :message="form.errors.sort_order" class="mt-2" />
                                </div>
                            </template>

                            <template #actions>
                                <Link :href="route('admin.products.index')">
                                    <SecondaryButton>Cancel</SecondaryButton>
                                </Link>

                                <PrimaryButton
                                    :class="{ 'opacity-25': form.processing }"
                                    :disabled="form.processing"
                                >
                                    Create Product
                                </PrimaryButton>
                            </template>
                        </FormSection>
                    </form>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

