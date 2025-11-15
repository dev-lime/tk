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

		$updateFields = [];
		$params = [];
		$paramCount = 1;

		$allowedFields = ['plate_number', 'model', 'capacity_kg', 'status'];

		foreach ($allowedFields as $field) {
			if (isset($input[$field])) {
				$updateFields[] = "$field = \${$paramCount}";
				$params[] = $input[$field];
				$paramCount++;
			}
		}

		if (empty($updateFields)) {
			throw new Exception("No fields to update");
		}

		$params[] = $vehicleId;

		$query = "UPDATE vehicles SET " . implode(', ', $updateFields) . " WHERE vehicle_id = \${$paramCount}";

		$result = pg_query_params($con, $query, $params);

		if (!$result) {
			throw new Exception("Database update failed: " . pg_last_error($con));
		}

		echo json_encode([
			'status' => 'success',
			'message' => 'Vehicle updated successfully'
		]);

	} catch (Exception $e) {
		error_log("update_vehicle.php error: " . $e->getMessage());
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