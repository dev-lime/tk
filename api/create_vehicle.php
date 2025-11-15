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
		if (empty($input['plate_number']) || empty($input['model']) || empty($input['capacity_kg'])) {
			throw new Exception("Plate number, model and capacity are required");
		}

		$con = getDBConnection();

		// Check if plate number already exists
		$checkQuery = "SELECT vehicle_id FROM vehicles WHERE plate_number = $1";
		$checkResult = pg_query_params($con, $checkQuery, [$input['plate_number']]);
		if (pg_num_rows($checkResult) > 0) {
			throw new Exception("Vehicle with this plate number already exists");
		}

		// Insert vehicle
		$insertQuery = "INSERT INTO vehicles (plate_number, model, capacity_kg, status) 
                       VALUES ($1, $2, $3, $4) RETURNING vehicle_id";
		$insertParams = [
			$input['plate_number'],
			$input['model'],
			$input['capacity_kg'],
			$input['status'] ?? 'available'
		];

		$result = pg_query_params($con, $insertQuery, $insertParams);

		if (!$result) {
			throw new Exception("Failed to create vehicle: " . pg_last_error($con));
		}

		$vehicleId = pg_fetch_result($result, 0, 'vehicle_id');

		echo json_encode([
			'status' => 'success',
			'message' => 'Vehicle created successfully',
			'vehicle_id' => $vehicleId
		]);

	} catch (Exception $e) {
		error_log("create_vehicle.php error: " . $e->getMessage());
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