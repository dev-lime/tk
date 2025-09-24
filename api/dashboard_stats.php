<?php
require_once 'middleware.php';
require_once '../config/database.php';

try {
	setupAPI();
	$user = requireAuth(); // Любой авторизованный пользователь

	$con = getDBConnection();

	// Все запросы в одном месте для производительности
	$queries = [
		'total_orders' => "SELECT COUNT(*) FROM orders",
		'active_vehicles' => "SELECT COUNT(*) FROM vehicles WHERE status IN ('available', 'in_service')",
		'pending_orders' => "SELECT COUNT(*) FROM orders WHERE status = 'pending'",
		'total_revenue' => "SELECT COALESCE(SUM(price), 0) FROM orders WHERE status != 'cancelled'"
	];

	$stats = [];
	foreach ($queries as $key => $query) {
		$result = pg_query($con, $query);
		$stats[$key] = pg_fetch_result($result, 0, 0) ?: 0;
	}

	// Примерные тренды (можно вынести в отдельную логику)
	$stats['trends'] = [
		'orders' => 12.5,
		'vehicles' => 2,
		'pending' => -3,
		'revenue' => 8.2
	];

	echo json_encode([
		'status' => 'success',
		'data' => $stats,
		'timestamp' => date('Y-m-d H:i:s')
	]);

} catch (Exception $e) {
	handleAPIError($e);
}
?>