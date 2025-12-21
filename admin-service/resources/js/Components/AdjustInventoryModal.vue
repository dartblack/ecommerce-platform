<script setup>
import DialogModal from './DialogModal.vue';
import InputError from './InputError.vue';
import InputLabel from './InputLabel.vue';
import PrimaryButton from './PrimaryButton.vue';
import SecondaryButton from './SecondaryButton.vue';
import TextInput from './TextInput.vue';
import { useForm } from '@inertiajs/vue3';
import { computed } from 'vue';

const props = defineProps({
    show: {
        type: Boolean,
        default: false,
    },
    product: {
        type: Object,
        required: true,
    },
});

const emit = defineEmits(['close']);

const form = useForm({
    adjustment_type: 'add',
    quantity: 1,
    type: 'adjustment',
    reason: '',
    notes: '',
    reference_number: '',
});

const close = () => {
    form.reset();
    form.adjustment_type = 'add';
    form.quantity = 1;
    form.type = 'adjustment';
    emit('close');
};

const adjustInventory = () => {
    form.post(route('admin.inventory.adjust', props.product.id), {
        preserveScroll: true,
        onSuccess: () => {
            close();
        },
    });
};

const previewText = computed(() => {
    const currentStock = props.product.stock_quantity;
    const quantity = form.quantity || 0;
    
    if (form.adjustment_type === 'add') {
        return `This will add ${quantity} to the current stock of ${currentStock}. New total: ${currentStock + quantity}`;
    } else if (form.adjustment_type === 'remove') {
        const newTotal = Math.max(0, currentStock - quantity);
        return `This will remove ${quantity} from the current stock of ${currentStock}. New total: ${newTotal}`;
    } else {
        return `This will set the stock level to ${quantity} (current: ${currentStock}).`;
    }
});
</script>

<template>
    <DialogModal :show="show" max-width="2xl" @close="close">
        <template #title>
            Adjust Inventory: {{ product.name }}
        </template>

        <template #content>
            <div class="space-y-6">
                <div class="bg-gray-50 p-4 rounded-lg">
                    <div class="text-sm text-gray-600">
                        <span class="font-medium">Current Stock:</span>
                        <span class="ml-2 text-lg font-semibold">{{ product.stock_quantity }}</span>
                    </div>
                    <div class="text-sm text-gray-600 mt-1">
                        <span class="font-medium">SKU:</span>
                        <span class="ml-2 font-mono">{{ product.sku }}</span>
                    </div>
                </div>

                <form @submit.prevent="adjustInventory" class="space-y-4">
                    <!-- Adjustment Type -->
                    <div>
                        <InputLabel for="adjustment_type" value="Adjustment Type *" />
                        <select
                            id="adjustment_type"
                            v-model="form.adjustment_type"
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        >
                            <option value="add">Add Stock</option>
                            <option value="remove">Remove Stock</option>
                            <option value="set">Set Stock Level</option>
                        </select>
                        <InputError :message="form.errors.adjustment_type" class="mt-2" />
                    </div>

                    <!-- Quantity -->
                    <div>
                        <InputLabel for="quantity" value="Quantity *" />
                        <TextInput
                            id="quantity"
                            v-model.number="form.quantity"
                            type="number"
                            min="1"
                            class="mt-1 block w-full"
                            required
                        />
                        <p class="mt-1 text-sm text-gray-600">
                            {{ previewText }}
                        </p>
                        <InputError :message="form.errors.quantity" class="mt-2" />
                    </div>

                    <!-- Movement Type -->
                    <div>
                        <InputLabel for="type" value="Movement Type *" />
                        <select
                            id="type"
                            v-model="form.type"
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        >
                            <option value="adjustment">Stock Adjustment</option>
                            <option value="sale">Sale</option>
                            <option value="return">Return</option>
                            <option value="damage">Damage/Loss</option>
                            <option value="transfer_in">Transfer In</option>
                            <option value="transfer_out">Transfer Out</option>
                            <option value="initial_stock">Initial Stock</option>
                        </select>
                        <InputError :message="form.errors.type" class="mt-2" />
                    </div>

                    <!-- Reason -->
                    <div>
                        <InputLabel for="reason" value="Reason" />
                        <TextInput
                            id="reason"
                            v-model="form.reason"
                            type="text"
                            class="mt-1 block w-full"
                            placeholder="e.g., Restock, Customer return, etc."
                            maxlength="500"
                        />
                        <p class="mt-1 text-xs text-gray-500">
                            Optional. Maximum 500 characters.
                        </p>
                        <InputError :message="form.errors.reason" class="mt-2" />
                    </div>

                    <!-- Reference Number -->
                    <div>
                        <InputLabel for="reference_number" value="Reference Number" />
                        <TextInput
                            id="reference_number"
                            v-model="form.reference_number"
                            type="text"
                            class="mt-1 block w-full"
                            placeholder="e.g., PO-12345, Invoice #456"
                            maxlength="255"
                        />
                        <InputError :message="form.errors.reference_number" class="mt-2" />
                    </div>

                    <!-- Notes -->
                    <div>
                        <InputLabel for="notes" value="Notes" />
                        <textarea
                            id="notes"
                            v-model="form.notes"
                            rows="3"
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="Additional notes about this adjustment..."
                            maxlength="1000"
                        ></textarea>
                        <p class="mt-1 text-xs text-gray-500">
                            Optional. Maximum 1000 characters.
                        </p>
                        <InputError :message="form.errors.notes" class="mt-2" />
                    </div>
                </form>
            </div>
        </template>

        <template #footer>
            <SecondaryButton @click="close">
                Cancel
            </SecondaryButton>
            <PrimaryButton
                @click="adjustInventory"
                :class="{ 'opacity-25': form.processing }"
                :disabled="form.processing"
                class="ml-3"
            >
                Adjust Inventory
            </PrimaryButton>
        </template>
    </DialogModal>
</template>

