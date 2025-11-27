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
		$allowedRoles = ['admin'];

		if (!array_intersect($allowedRoles, $userRoles)) {
			throw new Exception("Access denied: Insufficient permissions");
		}

		// Get JSON input
		$input = json_decode(file_get_contents('php://input'), true);

		if (!$input) {
			throw new Exception("Invalid input data");
		}

		// Validate required fields
		$requiredFields = ['username', 'password', 'email', 'first_name', 'last_name', 'roles'];
		foreach ($requiredFields as $field) {
			if (empty($input[$field])) {
				throw new Exception("Field '{$field}' is required");
			}
		}

		// Validate roles
		if (!is_array($input['roles']) || empty($input['roles'])) {
			throw new Exception("At least one role must be selected");
		}

		$con = getDBConnection();

		if (!$con) {
			throw new Exception("Database connection failed");
		}

		// Check if username already exists
		$checkQuery = "SELECT user_id FROM users WHERE username = $1 OR email = $2";
		$checkResult = pg_query_params($con, $checkQuery, [$input['username'], $input['email']]);

		if (pg_num_rows($checkResult) > 0) {
			throw new Exception("Username or email already exists");
		}

		// Start transaction
		pg_query($con, "BEGIN");

		// Insert user
		$userQuery = "INSERT INTO users (username, password_hash, first_name, last_name, email, phone) 
                     VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id";

		$passwordHash = password_hash($input['password'], PASSWORD_DEFAULT);

		$userParams = [
			$input['username'],
			$passwordHash,
			$input['first_name'],
			$input['last_name'],
			$input['email'],
			$input['phone'] ?? null
		];

		$userResult = pg_query_params($con, $userQuery, $userParams);

		if (!$userResult) {
			throw new Exception("Failed to create user: " . pg_last_error($con));
		}

		$userId = pg_fetch_result($userResult, 0, 'user_id');

		// Insert roles
		foreach ($input['roles'] as $roleName) {
			// Get role_id
			$roleQuery = "SELECT role_id FROM roles WHERE role_name = $1";
			$roleResult = pg_query_params($con, $roleQuery, [$roleName]);

			if (pg_num_rows($roleResult) > 0) {
				$roleId = pg_fetch_result($roleResult, 0, 'role_id');

				$userRoleQuery = "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)";
				$userRoleResult = pg_query_params($con, $userRoleQuery, [$userId, $roleId]);

				if (!$userRoleResult) {
					throw new Exception("Failed to assign role: " . pg_last_error($con));
				}
			} else {
				throw new Exception("Invalid role: {$roleName}");
			}
		}

		// Create specialized records based on roles
		if (in_array('client', $input['roles'])) {
			$companyName = $input['company_name'] ?? '';
			// Company name теперь НЕ обязателен
			$clientQuery = "INSERT INTO clients (user_id, company_name) VALUES ($1, $2)";
			$clientResult = pg_query_params($con, $clientQuery, [$userId, $companyName]);

			if (!$clientResult) {
				throw new Exception("Failed to create client record: " . pg_last_error($con));
			}
		}

		if (in_array('driver', $input['roles'])) {
			$licenseNumber = $input['license_number'] ?? '';
			if (empty($licenseNumber)) {
				throw new Exception("License number is required for drivers");
			}

			$driverQuery = "INSERT INTO drivers (user_id, license_number) VALUES ($1, $2)";
			$driverResult = pg_query_params($con, $driverQuery, [$userId, $licenseNumber]);

			if (!$driverResult) {
				throw new Exception("Failed to create driver record: " . pg_last_error($con));
			}
		}

		// Commit transaction
		pg_query($con, "COMMIT");

		echo json_encode([
			'status' => 'success',
			'message' => 'User created successfully',
			'user_id' => $userId
		]);

	} catch (Exception $e) {
		// Rollback on error
		if ($con) {
			pg_query($con, "ROLLBACK");
		}

		error_log("create_user.php error: " . $e->getMessage());
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