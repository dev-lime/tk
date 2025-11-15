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

		if (!isset($_GET['user_id'])) {
			throw new Exception("User ID is required");
		}

		$userId = intval($_GET['user_id']);
		$con = getDBConnection();

		// Get user basic info
		$query = "SELECT user_id, username, email, first_name, last_name, middle_name, phone, created_at 
                  FROM users WHERE user_id = $1";
		$result = pg_query_params($con, $query, [$userId]);

		if (!$result || pg_num_rows($result) === 0) {
			throw new Exception("User not found");
		}

		$user = pg_fetch_assoc($result);

		// Get user roles
		$rolesQuery = "SELECT r.role_name FROM user_roles ur 
                      JOIN roles r ON ur.role_id = r.role_id 
                      WHERE ur.user_id = $1";
		$rolesResult = pg_query_params($con, $rolesQuery, [$userId]);

		$roles = [];
		while ($roleRow = pg_fetch_assoc($rolesResult)) {
			$roles[] = $roleRow['role_name'];
		}
		$user['roles'] = $roles;

		// Get specialized info
		$clientQuery = "SELECT company_name FROM clients WHERE user_id = $1";
		$clientResult = pg_query_params($con, $clientQuery, [$userId]);
		if (pg_num_rows($clientResult) > 0) {
			$user['company_name'] = pg_fetch_result($clientResult, 0, 'company_name');
		}

		$driverQuery = "SELECT license_number FROM drivers WHERE user_id = $1";
		$driverResult = pg_query_params($con, $driverQuery, [$userId]);
		if (pg_num_rows($driverResult) > 0) {
			$user['license_number'] = pg_fetch_result($driverResult, 0, 'license_number');
		}

		echo json_encode([
			'status' => 'success',
			'user' => $user
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