<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Response as ResponseFacade;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SalesReportController extends Controller
{
    /**
     * Display sales reports
     */
    public function index(Request $request): Response
    {
        [$period, $dateFrom, $dateTo, $salesData, $summary] = $this->extracted($request);

        return Inertia::render('Admin/SalesReports/Index', [
            'period' => $period,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'salesData' => $salesData,
            'summary' => $summary,
        ]);
    }

    /**
     * Get default date range based on period
     */
    private function getDefaultDateRange(string $period): array
    {
        $today = now();

        return match ($period) {
            'weekly' => [
                $today->copy()->subWeeks(11)->startOfWeek()->format('Y-m-d'),
                $today->format('Y-m-d'),
            ],
            'monthly' => [
                $today->copy()->subMonths(11)->startOfMonth()->format('Y-m-d'),
                $today->format('Y-m-d'),
            ],
            default => [
                $today->copy()->subDays(29)->format('Y-m-d'),
                $today->format('Y-m-d'),
            ],
        };
    }

    /**
     * Get sales data grouped by period
     */
    private function getSalesData(string $period, string $dateFrom, string $dateTo): array
    {
        $query = Order::where('payment_status', 'paid')
            ->whereBetween('created_at', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59']);

        return match ($period) {
            'weekly' => $this->getWeeklySales($query, $dateFrom, $dateTo),
            'monthly' => $this->getMonthlySales($query, $dateFrom, $dateTo),
            default => $this->getDailySales($query, $dateFrom, $dateTo),
        };
    }

    /**
     * Get daily sales data
     */
    private function getDailySales($query, string $dateFrom, string $dateTo): array
    {
        $sales = $query
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as order_count'),
                DB::raw('SUM(total) as total_revenue'),
                DB::raw('SUM(subtotal) as total_subtotal'),
                DB::raw('SUM(tax) as total_tax'),
                DB::raw('SUM(shipping) as total_shipping'),
                DB::raw('SUM(discount) as total_discount')
            )
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date', 'asc')
            ->get();

        $result = [];
        $current = Carbon::parse($dateFrom);
        $end = Carbon::parse($dateTo);

        while ($current <= $end) {
            $dateStr = $current->format('Y-m-d');
            $sale = $sales->firstWhere('date', $dateStr);

            $result[] = [
                'period' => $dateStr,
                'label' => $current->format('M d, Y'),
                'order_count' => $sale ? (int)$sale->order_count : 0,
                'total_revenue' => $sale ? (float)$sale->total_revenue : 0,
                'total_subtotal' => $sale ? (float)$sale->total_subtotal : 0,
                'total_tax' => $sale ? (float)$sale->total_tax : 0,
                'total_shipping' => $sale ? (float)$sale->total_shipping : 0,
                'total_discount' => $sale ? (float)$sale->total_discount : 0,
            ];

            $current->addDay();
        }

        return $result;
    }

    /**
     * Get weekly sales data
     */
    private function getWeeklySales($query, string $dateFrom, string $dateTo): array
    {
        $dbDriver = config('database.default');
        $isPostgres = config("database.connections.{$dbDriver}.driver") === 'pgsql';

        if ($isPostgres) {
            $dateFormat = "TO_CHAR(created_at, 'YYYY-\"W\"WW')";
        } else {
            $dateFormat = "DATE_FORMAT(created_at, '%Y-W%u')";
        }

        $sales = $query
            ->select(
                DB::raw($dateFormat . ' as week'),
                DB::raw('MIN(DATE(created_at)) as week_start'),
                DB::raw('COUNT(*) as order_count'),
                DB::raw('SUM(total) as total_revenue'),
                DB::raw('SUM(subtotal) as total_subtotal'),
                DB::raw('SUM(tax) as total_tax'),
                DB::raw('SUM(shipping) as total_shipping'),
                DB::raw('SUM(discount) as total_discount')
            )
            ->groupBy('week')
            ->orderBy('week', 'asc')
            ->get();

        $result = [];
        foreach ($sales as $sale) {
            $weekStart = Carbon::parse($sale->week_start);
            $weekEnd = $weekStart->copy()->endOfWeek();

            $result[] = [
                'period' => $sale->week,
                'label' => $weekStart->format('M d') . ' - ' . $weekEnd->format('M d, Y'),
                'order_count' => (int)$sale->order_count,
                'total_revenue' => (float)$sale->total_revenue,
                'total_subtotal' => (float)$sale->total_subtotal,
                'total_tax' => (float)$sale->total_tax,
                'total_shipping' => (float)$sale->total_shipping,
                'total_discount' => (float)$sale->total_discount,
            ];
        }

        return $result;
    }

    /**
     * Get monthly sales data
     */
    private function getMonthlySales($query, string $dateFrom, string $dateTo): array
    {
        $dbDriver = config('database.default');
        $isPostgres = config("database.connections.{$dbDriver}.driver") === 'pgsql';

        if ($isPostgres) {
            $dateFormat = "TO_CHAR(created_at, 'YYYY-MM')";
        } else {
            $dateFormat = "DATE_FORMAT(created_at, '%Y-%m')";
        }

        $sales = $query
            ->select(
                DB::raw($dateFormat . ' as month'),
                DB::raw('COUNT(*) as order_count'),
                DB::raw('SUM(total) as total_revenue'),
                DB::raw('SUM(subtotal) as total_subtotal'),
                DB::raw('SUM(tax) as total_tax'),
                DB::raw('SUM(shipping) as total_shipping'),
                DB::raw('SUM(discount) as total_discount')
            )
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->get();

        $result = [];
        foreach ($sales as $sale) {
            $month = Carbon::parse($sale->month . '-01');

            $result[] = [
                'period' => $sale->month,
                'label' => $month->format('F Y'),
                'order_count' => (int)$sale->order_count,
                'total_revenue' => (float)$sale->total_revenue,
                'total_subtotal' => (float)$sale->total_subtotal,
                'total_tax' => (float)$sale->total_tax,
                'total_shipping' => (float)$sale->total_shipping,
                'total_discount' => (float)$sale->total_discount,
            ];
        }

        return $result;
    }

    /**
     * Calculate summary statistics
     */
    private function calculateSummary(string $dateFrom, string $dateTo): array
    {
        $orders = Order::where('payment_status', 'paid')
            ->whereBetween('created_at', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59']);

        $totalOrders = $orders->count();
        $totalRevenue = $orders->sum('total');
        $totalSubtotal = $orders->sum('subtotal');
        $totalTax = $orders->sum('tax');
        $totalShipping = $orders->sum('shipping');
        $totalDiscount = $orders->sum('discount');
        $averageOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;

        // Get order status breakdown
        $statusBreakdown = Order::whereBetween('created_at', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        return [
            'total_orders' => $totalOrders,
            'total_revenue' => (float)$totalRevenue,
            'total_subtotal' => (float)$totalSubtotal,
            'total_tax' => (float)$totalTax,
            'total_shipping' => (float)$totalShipping,
            'total_discount' => (float)$totalDiscount,
            'average_order_value' => (float)$averageOrderValue,
            'status_breakdown' => $statusBreakdown,
        ];
    }

    /**
     * Export sales report to CSV
     */
    public function exportCsv(Request $request): StreamedResponse
    {
        [$period, $dateFrom, $dateTo, $salesData, $summary] = $this->extracted($request);

        $filename = 'sales-report-' . $period . '-' . $dateFrom . '-to-' . $dateTo . '.csv';

        return ResponseFacade::streamDownload(static function () use ($salesData, $summary, $period) {
            $file = fopen('php://output', 'wb');

            // BOM for UTF-8
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Header
            fputcsv($file, ['Sales Report - ' . ucfirst($period)]);
            fputcsv($file, ['Generated: ' . now()->format('Y-m-d H:i:s')]);
            fputcsv($file, []);

            // Summary
            fputcsv($file, ['Summary']);
            fputcsv($file, ['Total Orders', $summary['total_orders']]);
            fputcsv($file, ['Total Revenue', number_format($summary['total_revenue'], 2)]);
            fputcsv($file, ['Total Subtotal', number_format($summary['total_subtotal'], 2)]);
            fputcsv($file, ['Total Tax', number_format($summary['total_tax'], 2)]);
            fputcsv($file, ['Total Shipping', number_format($summary['total_shipping'], 2)]);
            fputcsv($file, ['Total Discount', number_format($summary['total_discount'], 2)]);
            fputcsv($file, ['Average Order Value', number_format($summary['average_order_value'], 2)]);
            fputcsv($file, []);

            // Sales Data
            fputcsv($file, ['Sales Data']);
            fputcsv($file, [
                'Period',
                'Orders',
                'Revenue',
                'Subtotal',
                'Tax',
                'Shipping',
                'Discount'
            ]);

            foreach ($salesData as $row) {
                fputcsv($file, [
                    $row['label'],
                    $row['order_count'],
                    number_format($row['total_revenue'], 2),
                    number_format($row['total_subtotal'], 2),
                    number_format($row['total_tax'], 2),
                    number_format($row['total_shipping'], 2),
                    number_format($row['total_discount'], 2),
                ]);
            }

            fputcsv($file, []);
            fputcsv($file, ['Total', $summary['total_orders'], number_format($summary['total_revenue'], 2)]);

            fclose($file);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Export sales report to PDF
     */
    public function exportPdf(Request $request): \Illuminate\Http\Response
    {
        [$period, $dateFrom, $dateTo, $salesData, $summary] = $this->extracted($request);

        $html = view('admin.sales-reports.pdf', [
            'period' => $period,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'salesData' => $salesData,
            'summary' => $summary,
        ])->render();

        $filename = 'sales-report-' . $period . '-' . $dateFrom . '-to-' . $dateTo . '.pdf';

        return Pdf::loadHTML($html)->download($filename);
    }

    /**
     * @param Request $request
     * @return array
     */
    private function extracted(Request $request): array
    {
        $period = $request->get('period', 'daily'); // daily, weekly, monthly
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');

        if (!$dateFrom || !$dateTo) {
            [$dateFrom, $dateTo] = $this->getDefaultDateRange($period);
        }

        $salesData = $this->getSalesData($period, $dateFrom, $dateTo);

        $summary = $this->calculateSummary($dateFrom, $dateTo);
        return array($period, $dateFrom, $dateTo, $salesData, $summary);
    }
}

