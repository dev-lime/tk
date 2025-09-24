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

		$period = $_GET['period'] ?? 'week';
		$con = getDBConnection();

		$chartData = [
			'labels' => [],
			'datasets' => [
				'completed' => [],
				'pending' => [],
				'cancelled' => []
			]
		];

		switch ($period) {
			case 'month':
				// Last 30 days data
				$query = "
                    SELECT 
                        DATE(created_at) as date,
                        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders,
                        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
                        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
                    FROM orders 
                    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
                    GROUP BY DATE(created_at)
                    ORDER BY date
                    LIMIT 30
                ";
				break;

			case 'quarter':
				// Last 90 days by month
				$query = "
                    SELECT 
                        TO_CHAR(created_at, 'YYYY-MM') as month,
                        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders,
                        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
                        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
                    FROM orders 
                    WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
                    GROUP BY TO_CHAR(created_at, 'YYYY-MM')
                    ORDER BY month
                    LIMIT 12
                ";
				break;

			case 'week':
			default:
				// Last 7 days data
				$query = "
                    SELECT 
                        DATE(created_at) as date,
                        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders,
                        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
                        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
                    FROM orders 
                    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
                    GROUP BY DATE(created_at)
                    ORDER BY date
                    LIMIT 7
                ";
				break;
		}

		$result = pg_query($con, $query);

		if (!$result) {
			throw new Exception("Database query failed: " . pg_last_error($con));
		}

		while ($row = pg_fetch_assoc($result)) {
			if ($period === 'quarter') {
				$chartData['labels'][] = $row['month'];
			} else {
				$chartData['labels'][] = date('D', strtotime($row['date']));
			}

			$chartData['datasets']['completed'][] = (int) $row['completed_orders'];
			$chartData['datasets']['pending'][] = (int) $row['pending_orders'];
			$chartData['datasets']['cancelled'][] = (int) $row['cancelled_orders'];
		}

		// If no data, return empty arrays
		if (empty($chartData['labels'])) {
			$chartData = [
				'labels' => [],
				'datasets' => [
					'completed' => [],
					'pending' => [],
					'cancelled' => []
				]
			];
		}

		echo json_encode([
			'status' => 'success',
			'period' => $period,
			'chart_data' => $chartData,
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