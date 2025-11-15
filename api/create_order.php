<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
	if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
		http_response_code(200);
		exit();
	}

	try {
		// Check permissions
		if (!isset($_SESSION['user']) || !isset($_SESSION['user']['roles'])) {
			throw new Exception("Access denied: User not authenticated");
		}

		$userRoles = $_SESSION['user']['roles'];
		$allowedRoles = ['admin', 'dispatcher'];
		if (!array_intersect($allowedRoles, $userRoles)) {
			throw new Exception("Access denied: Insufficient permissions");
		}

		$input = json_decode(file_get_contents('php://input'), true);

		if (!$input) {
			throw new Exception("Invalid JSON input");
		}

		// Validate required fields
		if (empty($input['client_id']) || empty($input['origin']) || empty($input['destination'])) {
			throw new Exception("Client, origin and destination are required");
		}

		$con = getDBConnection();

		// Check if client exists
		$clientCheckQuery = "SELECT user_id FROM clients WHERE user_id = $1";
		$clientCheckResult = pg_query_params($con, $clientCheckQuery, [$input['client_id']]);
		if (pg_num_rows($clientCheckResult) === 0) {
			throw new Exception("Client not found");
		}

		// Insert order
		$insertQuery = "INSERT INTO orders (client_id, dispatcher_id, driver_id, vehicle_id, origin, destination, 
                         cargo_description, weight_kg, price, delivery_date) 
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING order_id";
		$insertParams = [
			$input['client_id'],
			$_SESSION['user']['user_id'] ?? null, // current dispatcher
			$input['driver_id'] ?? null,
			$input['vehicle_id'] ?? null,
			$input['origin'],
			$input['destination'],
			$input['cargo_description'] ?? null,
			$input['weight_kg'] ?? null,
			$input['price'] ?? null,
			$input['delivery_date'] ?? null
		];

		$result = pg_query_params($con, $insertQuery, $insertParams);

		if (!$result) {
			throw new Exception("Failed to create order: " . pg_last_error($con));
		}

		$orderId = pg_fetch_result($result, 0, 'order_id');

		// Add to order history
		$historyQuery = "INSERT INTO order_history (order_id, action, description) 
                        VALUES ($1, 'created', 'Order was created by " . ($_SESSION['user']['username'] ?? 'system') . "')";
		@pg_query_params($con, $historyQuery, [$orderId]);

		echo json_encode([
			'status' => 'success',
			'message' => 'Order created successfully',
			'order_id' => $orderId
		]);

	} catch (Exception $e) {
		error_log("create_order.php error: " . $e->getMessage());
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