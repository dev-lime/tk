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

		if (!$input || !isset($input['order_id'])) {
			throw new Exception("Order ID is required");
		}

		$orderId = intval($input['order_id']);
		$con = getDBConnection();

		// Check if order exists and can be cancelled
		$checkQuery = "SELECT status FROM orders WHERE order_id = $1";
		$checkResult = pg_query_params($con, $checkQuery, [$orderId]);

		if (!$checkResult || pg_num_rows($checkResult) === 0) {
			throw new Exception("Order not found");
		}

		$order = pg_fetch_assoc($checkResult);

		// Check if order can be cancelled (not already delivered or cancelled)
		if ($order['status'] === 'delivered') {
			throw new Exception("Cannot cancel delivered order");
		}

		if ($order['status'] === 'cancelled') {
			throw new Exception("Order is already cancelled");
		}

		// Update order status to cancelled
		$updateQuery = "UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE order_id = $1";
		$updateResult = pg_query_params($con, $updateQuery, [$orderId]);

		if (!$updateResult) {
			throw new Exception("Failed to cancel order: " . pg_last_error($con));
		}

		// Add to order history
		$historyQuery = "INSERT INTO order_history (order_id, action, description) 
                        VALUES ($1, 'cancelled', 'Order was cancelled by " . ($_SESSION['user']['username'] ?? 'system') . "')";
		@pg_query_params($con, $historyQuery, [$orderId]);

		echo json_encode([
			'status' => 'success',
			'message' => 'Order cancelled successfully'
		]);

	} catch (Exception $e) {
		error_log("cancel_order.php error: " . $e->getMessage());
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