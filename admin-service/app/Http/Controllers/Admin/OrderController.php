<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateOrderStatusRequest;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    /**
     * Display a listing of orders
     */
    public function index(Request $request): Response
    {
        // Build base query
        $query = Order::with(['user', 'orderItems.product']);

        // Filter by trashed status
        $trashed = $request->get('trashed', '');
        if ($trashed === 'only') {
            $query->onlyTrashed();
        } elseif ($trashed === 'with') {
            $query->withTrashed();
        }

        // Search - order number, customer name/email
        $search = $request->input('search');
        if ($search !== null && trim($search) !== '') {
            $search = trim($search);
            $searchTerm = '%' . $search . '%';
            
            $dbDriver = config('database.default');
            $isPostgres = config("database.connections.{$dbDriver}.driver") === 'pgsql';
            
            $query->where(function ($q) use ($searchTerm, $isPostgres) {
                if ($isPostgres) {
                    $q->whereRaw('order_number ILIKE ?', [$searchTerm])
                        ->orWhereRaw('shipping_first_name ILIKE ?', [$searchTerm])
                        ->orWhereRaw('shipping_last_name ILIKE ?', [$searchTerm])
                        ->orWhereRaw('shipping_email ILIKE ?', [$searchTerm])
                        ->orWhereRaw('billing_email ILIKE ?', [$searchTerm])
                        ->orWhereHas('user', function ($userQuery) use ($searchTerm, $isPostgres) {
                            if ($isPostgres) {
                                $userQuery->whereRaw('name ILIKE ?', [$searchTerm])
                                    ->orWhereRaw('email ILIKE ?', [$searchTerm]);
                            } else {
                                $userQuery->whereRaw('LOWER(name) LIKE LOWER(?)', [$searchTerm])
                                    ->orWhereRaw('LOWER(email) LIKE LOWER(?)', [$searchTerm]);
                            }
                        });
                } else {
                    $q->whereRaw('LOWER(order_number) LIKE LOWER(?)', [$searchTerm])
                        ->orWhereRaw('LOWER(shipping_first_name) LIKE LOWER(?)', [$searchTerm])
                        ->orWhereRaw('LOWER(shipping_last_name) LIKE LOWER(?)', [$searchTerm])
                        ->orWhereRaw('LOWER(shipping_email) LIKE LOWER(?)', [$searchTerm])
                        ->orWhereRaw('LOWER(billing_email) LIKE LOWER(?)', [$searchTerm])
                        ->orWhereHas('user', function ($userQuery) use ($searchTerm) {
                            $userQuery->whereRaw('LOWER(name) LIKE LOWER(?)', [$searchTerm])
                                ->orWhereRaw('LOWER(email) LIKE LOWER(?)', [$searchTerm]);
                        });
                }
            });
        }

        // Filter by status
        $status = $request->input('status');
        if ($status !== null && $status !== '') {
            $query->where('status', $status);
        }

        // Filter by payment status
        $paymentStatus = $request->input('payment_status');
        if ($paymentStatus !== null && $paymentStatus !== '') {
            $query->where('payment_status', $paymentStatus);
        }

        // Filter by user/customer
        $userId = $request->input('user_id');
        if ($userId !== null && $userId !== '') {
            $query->where('user_id', $userId);
        }

        // Filter by date range
        $dateFrom = $request->input('date_from');
        if ($dateFrom !== null && $dateFrom !== '') {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        $dateTo = $request->input('date_to');
        if ($dateTo !== null && $dateTo !== '') {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        
        // For trashed items, also sort by deleted_at
        if ($trashed === 'only' || $trashed === 'with') {
            $query->orderBy('deleted_at', 'desc')->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy($sortBy, $sortOrder);
        }

        $orders = $query->paginate($request->get('per_page', 15))
            ->withQueryString();

        // Get all customers for filter dropdown
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
    public function updateStatus(UpdateOrderStatusRequest $request, $id)
    {
        $order = Order::findOrFail($id);

        $data = $request->validated();

        if (isset($data['status'])) {
            $order->status = $data['status'];
            
            // Set timestamps based on status
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

        return redirect()->back()
            ->with('success', 'Order status updated successfully.');
    }

    /**
     * Mark order as shipped
     */
    public function markAsShipped(Request $request, $id)
    {
        $request->validate([
            'tracking_number' => ['nullable', 'string', 'max:255'],
        ]);

        $order = Order::findOrFail($id);

        if (!$order->canBeShipped()) {
            return redirect()->back()
                ->with('error', 'Order cannot be shipped. It must be in processing status with paid payment.');
        }

        $order->markAsShipped($request->input('tracking_number'));

        return redirect()->back()
            ->with('success', 'Order marked as shipped successfully.');
    }

    /**
     * Mark order as delivered
     */
    public function markAsDelivered($id)
    {
        $order = Order::findOrFail($id);

        if ($order->status !== 'shipped') {
            return redirect()->back()
                ->with('error', 'Order must be shipped before it can be marked as delivered.');
        }

        $order->markAsDelivered();

        return redirect()->back()
            ->with('success', 'Order marked as delivered successfully.');
    }

    /**
     * Cancel the order
     */
    public function cancel($id)
    {
        $order = Order::findOrFail($id);

        if (!$order->canBeCancelled()) {
            return redirect()->back()
                ->with('error', 'Order cannot be cancelled. Only pending or processing orders can be cancelled.');
        }

        $order->cancel();

        return redirect()->back()
            ->with('success', 'Order cancelled successfully.');
    }
}

