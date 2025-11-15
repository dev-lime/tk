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

		$userRoles = $_SESSION['user']['roles'];
		$allowedRoles = ['admin', 'dispatcher'];
		if (!array_intersect($allowedRoles, $userRoles)) {
			throw new Exception("Access denied: Insufficient permissions");
		}

		if (!isset($_GET['vehicle_id'])) {
			throw new Exception("Vehicle ID is required");
		}

		$vehicleId = intval($_GET['vehicle_id']);
		$con = getDBConnection();

		$query = "SELECT vehicle_id, plate_number, model, capacity_kg, status 
                  FROM vehicles WHERE vehicle_id = $1";
		$result = pg_query_params($con, $query, [$vehicleId]);

		if (!$result || pg_num_rows($result) === 0) {
			throw new Exception("Vehicle not found");
		}

		$vehicle = pg_fetch_assoc($result);

		echo json_encode([
			'status' => 'success',
			'vehicle' => $vehicle
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