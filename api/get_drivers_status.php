<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET' || $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
	if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
		http_response_code(200);
		exit();
	}

	try {
		if (!isset($_SESSION['user']) || !isset($_SESSION['user']['roles'])) {
			throw new Exception("Access denied: User not authenticated");
		}

		$con = getDBConnection();

		// Получаем статусы водителей из активных заказов
		$query = "SELECT 
                    d.user_id,
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM orders 
                            WHERE driver_id = d.user_id AND status = 'in_transit'
                        ) THEN 'on_delivery'
                        WHEN EXISTS (
                            SELECT 1 FROM orders 
                            WHERE driver_id = d.user_id AND status = 'assigned'
                        ) THEN 'assigned'
                        ELSE 'available'
                    END as driver_status
                  FROM drivers d";

		$result = pg_query($con, $query);

		if (!$result) {
			throw new Exception("Database query failed: " . pg_last_error($con));
		}

		$driverStatuses = [];
		while ($row = pg_fetch_assoc($result)) {
			$driverStatuses[$row['user_id']] = $row['driver_status'];
		}

		echo json_encode([
			'status' => 'success',
			'driver_statuses' => $driverStatuses
		]);

	} catch (Exception $e) {
		http_response_code(500);
		echo json_encode([
			'status' => 'error',
			'message' => $e->getMessage()
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