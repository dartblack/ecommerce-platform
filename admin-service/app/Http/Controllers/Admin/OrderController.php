<?php

namespace App\Http\Controllers\Admin;

use App\Events\OrderCancelled;
use App\Events\OrderDelivered;
use App\Events\OrderShipped;
use App\Events\OrderStatusChanged;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDeleteRequest;
use App\Http\Requests\Admin\BulkUpdateOrdersRequest;
use App\Http\Requests\Admin\UpdateOrderStatusRequest;
use App\Jobs\SendOrderStatusUpdateJob;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{

    /**
     * Display a listing of orders
     */
    public function index(Request $request): Response
    {
        $query = Order::with(['user', 'orderItems.product']);
        $trashed = $request->get('trashed', '');
        if ($trashed === 'only') {
            $query->onlyTrashed();
        } elseif ($trashed === 'with') {
            $query->withTrashed();
        }

        $search = $request->input('search');
        if ($search !== null && trim($search) !== '') {
            $search = trim($search);
            $searchTerm = '%' . $search . '%';

            $query->where(function ($q) use ($searchTerm) {
                $q->whereRaw('order_number ILIKE ?', [$searchTerm])
                    ->orWhereRaw('shipping_first_name ILIKE ?', [$searchTerm])
                    ->orWhereRaw('shipping_last_name ILIKE ?', [$searchTerm])
                    ->orWhereRaw('shipping_email ILIKE ?', [$searchTerm])
                    ->orWhereRaw('billing_email ILIKE ?', [$searchTerm])
                    ->orWhereHas('user', function ($userQuery) use ($searchTerm) {
                        $userQuery->whereRaw('name ILIKE ?', [$searchTerm])
                            ->orWhereRaw('email ILIKE ?', [$searchTerm]);
                    });
            });
        }

        $status = $request->input('status');
        if ($status !== null && $status !== '') {
            $query->where('status', $status);
        }

        $paymentStatus = $request->input('payment_status');
        if ($paymentStatus !== null && $paymentStatus !== '') {
            $query->where('payment_status', $paymentStatus);
        }

        $userId = $request->input('user_id');
        if ($userId !== null && $userId !== '') {
            $query->where('user_id', $userId);
        }

        $dateFrom = $request->input('date_from');
        if ($dateFrom !== null && $dateFrom !== '') {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        $dateTo = $request->input('date_to');
        if ($dateTo !== null && $dateTo !== '') {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');

        if ($trashed === 'only' || $trashed === 'with') {
            $query->orderBy('deleted_at', 'desc')->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy($sortBy, $sortOrder);
        }

        $orders = $query->paginate($request->get('per_page', 15))
            ->withQueryString();

        $customers = User::where('role', 'customer')
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Orders/Index', [
            'orders' => $orders,
            'customers' => $customers,
            'filters' => $request->only([
                'search',
                'status',
                'payment_status',
                'user_id',
                'date_from',
                'date_to',
                'sort_by',
                'sort_order',
                'trashed',
            ]),
        ]);
    }

    /**
     * Display the specified order
     */
    public function show($id): Response
    {
        $order = Order::withTrashed()
            ->with(['user', 'orderItems.product'])
            ->findOrFail($id);

        return Inertia::render('Admin/Orders/Show', [
            'order' => $order,
            'isDeleted' => $order->trashed(),
        ]);
    }

    /**
     * Update the order status
     */
    public function updateStatus(UpdateOrderStatusRequest $request, $id): RedirectResponse
    {
        $order = Order::findOrFail($id);
        $oldStatus = $order->status;

        $data = $request->validated();

        if (isset($data['status'])) {
            $order->status = $data['status'];
            if ($data['status'] === 'shipped' && !$order->shipped_at) {
                $order->shipped_at = now();
            } elseif ($data['status'] === 'delivered' && !$order->delivered_at) {
                $order->delivered_at = now();
            } elseif ($data['status'] === 'cancelled' && !$order->cancelled_at) {
                $order->cancelled_at = now();
            }
        }

        if (isset($data['payment_status'])) {
            $order->payment_status = $data['payment_status'];
        }

        if (isset($data['tracking_number'])) {
            $order->tracking_number = $data['tracking_number'];
        }

        $order->save();

        if (isset($data['status']) || isset($data['payment_status']) || isset($data['tracking_number'])) {
            SendOrderStatusUpdateJob::dispatch(
                $order->order_number,
                $order->status,
                $order->tracking_number,
                $order->payment_status
            );
        }

        $this->dispatchStatusChangedEventIfStatusWasUpdated($data, $order, $oldStatus);

        return redirect()->back()
            ->with('success', 'Order status updated successfully.');
    }

    /**
     * Mark order as shipped
     */
    public function markAsShipped(Request $request, $id): RedirectResponse
    {
        $request->validate([
            'tracking_number' => ['nullable', 'string', 'max:255'],
        ]);

        $order = Order::findOrFail($id);

        if (!$order->canBeShipped()) {
            return redirect()->back()
                ->with('error', 'Order cannot be shipped. It must be in processing status with paid payment.');
        }

        $oldStatus = $order->status;
        $order->markAsShipped($request->input('tracking_number'));
        $order->refresh();

        SendOrderStatusUpdateJob::dispatch(
            $order->order_number,
            $order->status,
            $order->tracking_number,
            $order->payment_status
        );

        event(new OrderStatusChanged($order, $oldStatus, $order->status));
        event(new OrderShipped($order));

        return redirect()->back()
            ->with('success', 'Order marked as shipped successfully.');
    }

    /**
     * Mark order as delivered
     */
    public function markAsDelivered($id): RedirectResponse
    {
        $order = Order::findOrFail($id);

        if ($order->status !== 'shipped') {
            return redirect()->back()
                ->with('error', 'Order must be shipped before it can be marked as delivered.');
        }

        $oldStatus = $order->status;
        $order->markAsDelivered();
        $order->refresh();

        SendOrderStatusUpdateJob::dispatch(
            $order->order_number,
            $order->status,
            $order->tracking_number,
            $order->payment_status
        );

        event(new OrderStatusChanged($order, $oldStatus, $order->status));
        event(new OrderDelivered($order));

        return redirect()->back()
            ->with('success', 'Order marked as delivered successfully.');
    }

    /**
     * Cancel the order
     */
    public function cancel($id): RedirectResponse
    {
        $order = Order::findOrFail($id);

        if (!$order->canBeCancelled()) {
            return redirect()->back()
                ->with('error', 'Order cannot be cancelled. Only pending or processing orders can be cancelled.');
        }

        $oldStatus = $order->status;
        $order->cancel();
        $order->refresh();

        SendOrderStatusUpdateJob::dispatch(
            $order->order_number,
            $order->status,
            $order->tracking_number,
            $order->payment_status
        );

        event(new OrderStatusChanged($order, $oldStatus, $order->status));
        event(new OrderCancelled($order));

        return redirect()->back()
            ->with('success', 'Order cancelled successfully.');
    }

    /**
     * Bulk delete orders
     */
    public function bulkDelete(BulkDeleteRequest $request): RedirectResponse
    {
        $ids = $request->validated()['ids'];
        $count = 0;

        DB::transaction(static function () use ($ids, &$count) {
            $orders = Order::whereIn('id', $ids)
                ->whereNull('deleted_at')
                ->get();

            foreach ($orders as $order) {
                $order->delete();
                $count++;
            }
        });

        return redirect()
            ->route('admin.orders.index')
            ->with('success', "{$count} order(s) deleted successfully.");
    }

    /**
     * Bulk update orders
     */
    public function bulkUpdate(BulkUpdateOrdersRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $ids = $data['ids'];
        unset($data['ids']);

        $updateData = array_filter($data, static fn($value) => $value !== null);

        if (empty($updateData)) {
            return redirect()
                ->route('admin.orders.index')
                ->with('error', 'No fields to update.');
        }

        $count = 0;
        $updatedOrders = [];

        DB::transaction(function () use ($ids, $updateData, &$count, &$updatedOrders) {
            $orders = Order::whereIn('id', $ids)
                ->whereNull('deleted_at')
                ->get();

            foreach ($orders as $order) {
                $oldStatus = $order->status;
                if (isset($updateData['status'])) {
                    if ($updateData['status'] === 'shipped' && !$order->shipped_at) {
                        $updateData['shipped_at'] = now();
                    } elseif ($updateData['status'] === 'delivered' && !$order->delivered_at) {
                        $updateData['delivered_at'] = now();
                    } elseif ($updateData['status'] === 'cancelled' && !$order->cancelled_at) {
                        $updateData['cancelled_at'] = now();
                    }
                }

                $order->update($updateData);
                if (isset($updateData['status']) || isset($updateData['payment_status'])) {
                    SendOrderStatusUpdateJob::dispatch(
                        $order->order_number,
                        $order->status,
                        $order->tracking_number,
                        $order->payment_status
                    );
                }
                $this->dispatchStatusChangedEventIfStatusWasUpdated($updateData, $order, $oldStatus);

                $updatedOrders[] = $order;
                $count++;
            }
        });

        $fields = implode(', ', array_keys($updateData));
        return redirect()
            ->route('admin.orders.index')
            ->with('success', "{$count} order(s) updated successfully. Updated fields: {$fields}.");
    }

    /**
     * Bulk cancel orders
     */
    public function bulkCancel(Request $request): RedirectResponse
    {
        $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer', 'exists:orders,id'],
        ]);

        $ids = $request->validated()['ids'];
        $count = 0;
        $errors = [];

        DB::transaction(static function () use ($ids, &$count, &$errors) {
            $orders = Order::whereIn('id', $ids)
                ->whereNull('deleted_at')
                ->get();

            foreach ($orders as $order) {
                if ($order->canBeCancelled()) {
                    $oldStatus = $order->status;
                    $order->cancel();
                    $order->refresh();

                    SendOrderStatusUpdateJob::dispatch(
                        $order->order_number,
                        $order->status,
                        $order->tracking_number,
                        $order->payment_status
                    );

                    // Dispatch events
                    event(new OrderStatusChanged($order, $oldStatus, $order->status));
                    event(new OrderCancelled($order));

                    $count++;
                } else {
                    $errors[] = "Order '{$order->order_number}' cannot be cancelled. Only pending or processing orders can be cancelled.";
                }
            }
        });

        $message = "{$count} order(s) cancelled successfully.";
        if (!empty($errors)) {
            $message .= ' ' . implode(' ', array_slice($errors, 0, 3));
            if (count($errors) > 3) {
                $message .= ' And ' . (count($errors) - 3) . ' more.';
            }
        }

        return redirect()
            ->route('admin.orders.index')
            ->with($count > 0 ? 'success' : 'error', $message);
    }

    /**
     * @param mixed $data
     * @param $order
     * @param $oldStatus
     * @return void
     */
    private function dispatchStatusChangedEventIfStatusWasUpdated(mixed $data, $order, $oldStatus): void
    {
        if (isset($data['status']) && $oldStatus !== $order->status) {
            event(new OrderStatusChanged($order, $oldStatus, $order->status));
            if ($order->status === 'shipped') {
                event(new OrderShipped($order));
            } elseif ($order->status === 'delivered') {
                event(new OrderDelivered($order));
            } elseif ($order->status === 'cancelled') {
                event(new OrderCancelled($order));
            }
        }
    }
}

