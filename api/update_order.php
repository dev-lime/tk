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

		// Get JSON input
		$input = json_decode(file_get_contents('php://input'), true);

		if (!$input || !isset($input['order_id'])) {
			throw new Exception("Order ID is required");
		}

		$orderId = intval($input['order_id']);
		$con = getDBConnection();

		if (!$con) {
			throw new Exception("Database connection failed");
		}

		// Build update query dynamically based on provided fields
		$updateFields = [];
		$params = [];
		$paramCount = 1;

		$allowedFields = [
			'origin',
			'destination',
			'cargo_description',
			'weight_kg',
			'status',
			'price',
			'delivery_date',
			'driver_id',
			'vehicle_id'
		];

		foreach ($allowedFields as $field) {
			if (isset($input[$field])) {
				if ($field === 'driver_id' && $input[$field] === '') {
					$updateFields[] = "driver_id = NULL";
				} elseif ($field === 'vehicle_id' && $input[$field] === '') {
					$updateFields[] = "vehicle_id = NULL";
				} else {
					$updateFields[] = "$field = \${$paramCount}";
					$params[] = $input[$field];
					$paramCount++;
				}
			}
		}

		// Always update the updated_at timestamp
		$updateFields[] = "updated_at = CURRENT_TIMESTAMP";

		if (empty($updateFields)) {
			throw new Exception("No fields to update");
		}

		$params[] = $orderId;

		$query = "UPDATE orders SET " . implode(', ', $updateFields) . " WHERE order_id = \${$paramCount}";

		$result = pg_query_params($con, $query, $params);

		if (!$result) {
			throw new Exception("Database update failed: " . pg_last_error($con));
		}

		// Add to order history
		$historyQuery = "INSERT INTO order_history (order_id, action, description) 
                        VALUES ($1, $2, $3)";
		$historyParams = [
			$orderId,
			'updated',
			'Order details were updated by ' . ($_SESSION['user']['username'] ?? 'system')
		];
		@pg_query_params($con, $historyQuery, $historyParams);

		echo json_encode([
			'status' => 'success',
			'message' => 'Order updated successfully'
		]);

	} catch (Exception $e) {
		error_log("update_order.php error: " . $e->getMessage());
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