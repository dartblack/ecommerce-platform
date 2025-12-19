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
    product: Object,
    categories: Array,
});

const form = useForm({
    _method: 'PUT',
    name: props.product.name,
    slug: props.product.slug,
    description: props.product.description || '',
    short_description: props.product.short_description || '',
    sku: props.product.sku,
    price: props.product.price,
    compare_at_price: props.product.compare_at_price || '',
    category_id: props.product.category_id,
    stock_quantity: props.product.stock_quantity,
    stock_status: props.product.stock_status,
    is_active: props.product.is_active,
    image: null,
    sort_order: props.product.sort_order,
});

const imagePreview = ref(null);
const imageInput = ref(null);
const currentImageUrl = ref(props.product.image_url);

const updateProduct = () => {
    if (imageInput.value && imageInput.value.files[0]) {
        form.image = imageInput.value.files[0];
    }

    form.post(route('admin.products.update', props.product.id), {
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
        currentImageUrl.value = null; // Hide current image when new one is selected
    };

    reader.readAsDataURL(image);
};

const clearImagePreview = () => {
    imagePreview.value = null;
    if (imageInput.value?.value) {
        imageInput.value.value = null;
    }
    // Restore current image view
    currentImageUrl.value = props.product.image_url;
};
</script>

<template>
    <AppLayout title="Edit Product">
        <template #header>
            <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                Edit Product
            </h2>
        </template>

        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                    <form @submit.prevent="updateProduct" class="p-6">
                        <FormSection @submitted="updateProduct">
                            <template #title> Product Information </template>

                            <template #description>
                                Update the product information. You can upload a new image to replace the existing one.
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

                                    <!-- New Image Preview -->
                                    <div v-show="imagePreview" class="mt-2">
                                        <img
                                            :src="imagePreview"
                                            alt="Product preview"
                                            class="h-48 w-48 object-cover rounded-lg border border-gray-300"
                                        />
                                    </div>

                                    <!-- Current Image -->
                                    <div v-show="!imagePreview && currentImageUrl" class="mt-2">
                                        <img
                                            :src="currentImageUrl"
                                            :alt="product.name"
                                            class="h-48 w-48 object-cover rounded-lg border border-gray-300"
                                        />
                                    </div>

                                    <!-- No Image -->
                                    <div v-show="!imagePreview && !currentImageUrl" class="mt-2">
                                        <div class="h-48 w-48 bg-gray-200 rounded-lg border border-gray-300 flex items-center justify-center">
                                            <span class="text-gray-400 text-sm">No image</span>
                                        </div>
                                    </div>

                                    <SecondaryButton class="mt-2" type="button" @click.prevent="selectImage">
                                        {{ currentImageUrl ? 'Change Image' : 'Select Image' }}
                                    </SecondaryButton>

                                    <SecondaryButton
                                        v-if="imagePreview"
                                        type="button"
                                        class="mt-2 ml-2"
                                        @click.prevent="clearImagePreview"
                                    >
                                        Cancel
                                    </SecondaryButton>

                                    <p class="mt-1 text-sm text-gray-500">
                                        Recommended: JPEG, PNG, GIF, or WebP (max 2MB). Leave unchanged to keep current image.
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
                                        Lower numbers appear first.
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
                                    Update Product
                                </PrimaryButton>
                            </template>
                        </FormSection>
                    </form>
                </div>
            </div>
        </div>
    </AppLayout>
</template>

