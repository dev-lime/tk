<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET' || $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {

	if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
		http_response_code(200);
		exit();
	}

	try {
		// Check authentication
		if (!isset($_SESSION['user']) || !isset($_SESSION['user']['logged_in']) || $_SESSION['user']['logged_in'] !== true) {
			throw new Exception("Access denied: User not authenticated");
		}

		$con = getDBConnection();

		// 1. Total Orders Count
		$totalOrdersQuery = "SELECT COUNT(*) as total_orders FROM orders";
		$totalOrdersResult = pg_query($con, $totalOrdersQuery);
		$totalOrders = pg_fetch_result($totalOrdersResult, 0, 'total_orders') ?: 0;

		// 2. Active Vehicles Count (available or in_service)
		$activeVehiclesQuery = "SELECT COUNT(*) as active_vehicles FROM vehicles 
                               WHERE status IN ('available', 'in_service')";
		$activeVehiclesResult = pg_query($con, $activeVehiclesQuery);
		$activeVehicles = pg_fetch_result($activeVehiclesResult, 0, 'active_vehicles') ?: 0;

		// 3. Pending Orders Count
		$pendingOrdersQuery = "SELECT COUNT(*) as pending_orders FROM orders 
                              WHERE status = 'pending'";
		$pendingOrdersResult = pg_query($con, $pendingOrdersQuery);
		$pendingOrders = pg_fetch_result($pendingOrdersResult, 0, 'pending_orders') ?: 0;

		// 4. Total Revenue (sum of all orders prices)
		$revenueQuery = "SELECT COALESCE(SUM(price), 0) as total_revenue FROM orders 
                        WHERE status != 'cancelled'";
		$revenueResult = pg_query($con, $revenueQuery);
		$totalRevenue = pg_fetch_result($revenueResult, 0, 'total_revenue') ?: 0;

		// 5. Calculate simple trends (you can enhance this with historical data)
		$ordersTrend = 12.5; // Example trend
		$vehiclesTrend = 2;  // Example trend
		$pendingTrend = -3;  // Example trend
		$revenueTrend = 8.2; // Example trend

		$stats = [
			'total_orders' => (int) $totalOrders,
			'active_vehicles' => (int) $activeVehicles,
			'pending_orders' => (int) $pendingOrders,
			'total_revenue' => (float) $totalRevenue,
			'trends' => [
				'orders' => $ordersTrend,
				'vehicles' => $vehiclesTrend,
				'pending' => $pendingTrend,
				'revenue' => $revenueTrend
			]
		];

		echo json_encode([
			'status' => 'success',
			'data' => $stats,
			'timestamp' => date('Y-m-d H:i:s')
		]);

	} catch (Exception $e) {
		http_response_code(500);
		echo json_encode([
			'status' => 'error',
			'message' => $e->getMessage(),
			'timestamp' => date('Y-m-d H:i:s')
		]);
	}
} else {
	http_response_code(405);
	echo json_encode([
		'status' => 'error',
		'message' => 'Method not allowed'
	]);
}
?>