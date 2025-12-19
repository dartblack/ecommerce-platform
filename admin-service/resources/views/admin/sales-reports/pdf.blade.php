<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sales Report - {{ ucfirst($period) }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: #333;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .header h1 {
            font-size: 24px;
            margin-bottom: 10px;
        }
        .header p {
            color: #666;
        }
        .summary {
            margin-bottom: 30px;
        }
        .summary h2 {
            font-size: 18px;
            margin-bottom: 15px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        .summary-item {
            padding: 10px;
            background: #f5f5f5;
            border-radius: 4px;
        }
        .summary-item label {
            display: block;
            font-weight: bold;
            margin-bottom: 5px;
            color: #666;
        }
        .summary-item .value {
            font-size: 16px;
            color: #333;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        th, td {
            padding: 10px;
            text-align: left;
            border: 1px solid #ddd;
        }
        th {
            background-color: #333;
            color: white;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .text-right {
            text-align: right;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 10px;
        }
        @media print {
            body {
                padding: 10px;
            }
            .no-print {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Sales Report - {{ ucfirst($period) }}</h1>
        <p>Period: {{ \Illuminate\Support\Carbon::parse($dateFrom)->format('M d, Y') }} to {{ \Illuminate\Support\Carbon::parse($dateTo)->format('M d, Y') }}</p>
        <p>Generated: {{ now()->format('M d, Y H:i:s') }}</p>
    </div>

    <div class="summary">
        <h2>Summary</h2>
        <div class="summary-grid">
            <div class="summary-item">
                <label>Total Orders</label>
                <div class="value">{{ number_format($summary['total_orders']) }}</div>
            </div>
            <div class="summary-item">
                <label>Total Revenue</label>
                <div class="value">${{ number_format($summary['total_revenue'], 2) }}</div>
            </div>
            <div class="summary-item">
                <label>Total Subtotal</label>
                <div class="value">${{ number_format($summary['total_subtotal'], 2) }}</div>
            </div>
            <div class="summary-item">
                <label>Total Tax</label>
                <div class="value">${{ number_format($summary['total_tax'], 2) }}</div>
            </div>
            <div class="summary-item">
                <label>Total Shipping</label>
                <div class="value">${{ number_format($summary['total_shipping'], 2) }}</div>
            </div>
            <div class="summary-item">
                <label>Total Discount</label>
                <div class="value">${{ number_format($summary['total_discount'], 2) }}</div>
            </div>
            <div class="summary-item">
                <label>Average Order Value</label>
                <div class="value">${{ number_format($summary['average_order_value'], 2) }}</div>
            </div>
        </div>
    </div>

    <h2 style="margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Sales Data</h2>
    <table>
        <thead>
            <tr>
                <th>Period</th>
                <th class="text-right">Orders</th>
                <th class="text-right">Revenue</th>
                <th class="text-right">Subtotal</th>
                <th class="text-right">Tax</th>
                <th class="text-right">Shipping</th>
                <th class="text-right">Discount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($salesData as $row)
            <tr>
                <td>{{ $row['label'] }}</td>
                <td class="text-right">{{ number_format($row['order_count']) }}</td>
                <td class="text-right">${{ number_format($row['total_revenue'], 2) }}</td>
                <td class="text-right">${{ number_format($row['total_subtotal'], 2) }}</td>
                <td class="text-right">${{ number_format($row['total_tax'], 2) }}</td>
                <td class="text-right">${{ number_format($row['total_shipping'], 2) }}</td>
                <td class="text-right">${{ number_format($row['total_discount'], 2) }}</td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr style="background-color: #f0f0f0; font-weight: bold;">
                <td>Total</td>
                <td class="text-right">{{ number_format($summary['total_orders']) }}</td>
                <td class="text-right">${{ number_format($summary['total_revenue'], 2) }}</td>
                <td class="text-right">${{ number_format($summary['total_subtotal'], 2) }}</td>
                <td class="text-right">${{ number_format($summary['total_tax'], 2) }}</td>
                <td class="text-right">${{ number_format($summary['total_shipping'], 2) }}</td>
                <td class="text-right">${{ number_format($summary['total_discount'], 2) }}</td>
            </tr>
        </tfoot>
    </table>

    @if(!empty($summary['status_breakdown']))
    <h2 style="margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 30px;">Order Status Breakdown</h2>
    <table>
        <thead>
            <tr>
                <th>Status</th>
                <th class="text-right">Count</th>
            </tr>
        </thead>
        <tbody>
            @foreach($summary['status_breakdown'] as $status => $count)
            <tr>
                <td>{{ ucfirst($status) }}</td>
                <td class="text-right">{{ number_format($count) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <div class="footer">
        <p>This report was generated on {{ now()->format('M d, Y H:i:s') }}</p>
    </div>
</body>
</html>

