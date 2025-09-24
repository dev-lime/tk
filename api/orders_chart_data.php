<?php
require_once 'middleware.php';
require_once '../config/database.php';

try {
	setupAPI();
	$user = requireAuth(); // Любой авторизованный пользователь

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
			// Данные за последние 30 дней
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
            ";
			break;

		case 'quarter':
			// Данные за последние 90 дней по месяцам
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
            ";
			break;

		case 'week':
		default:
			// Данные за последние 7 дней
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
			$chartData['labels'][] = date('m/d', strtotime($row['date']));
		}

		$chartData['datasets']['completed'][] = (int) $row['completed_orders'];
		$chartData['datasets']['pending'][] = (int) $row['pending_orders'];
		$chartData['datasets']['cancelled'][] = (int) $row['cancelled_orders'];
	}

	// Если нет данных, возвращаем пустые массивы
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
	handleAPIError($e);
}
?>