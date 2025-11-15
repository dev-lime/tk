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

		if (!$input || !isset($input['vehicle_id'])) {
			throw new Exception("Vehicle ID is required");
		}

		$vehicleId = intval($input['vehicle_id']);
		$con = getDBConnection();

		// Check if vehicle exists
		$checkQuery = "SELECT plate_number FROM vehicles WHERE vehicle_id = $1";
		$checkResult = pg_query_params($con, $checkQuery, [$vehicleId]);

		if (!$checkResult || pg_num_rows($checkResult) === 0) {
			throw new Exception("Vehicle not found");
		}

		// Check if vehicle is assigned to any active orders
		$ordersQuery = "SELECT COUNT(*) as active_orders FROM orders 
                       WHERE vehicle_id = $1 AND status IN ('assigned', 'in_transit')";
		$ordersResult = pg_query_params($con, $ordersQuery, [$vehicleId]);
		$activeOrders = pg_fetch_result($ordersResult, 0, 'active_orders');

		if ($activeOrders > 0) {
			throw new Exception("Cannot delete vehicle assigned to active orders");
		}

		// Delete vehicle
		$deleteQuery = "DELETE FROM vehicles WHERE vehicle_id = $1";
		$deleteResult = pg_query_params($con, $deleteQuery, [$vehicleId]);

		if (!$deleteResult) {
			throw new Exception("Failed to delete vehicle: " . pg_last_error($con));
		}

		echo json_encode([
			'status' => 'success',
			'message' => 'Vehicle deleted successfully'
		]);

	} catch (Exception $e) {
		error_log("delete_vehicle.php error: " . $e->getMessage());
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