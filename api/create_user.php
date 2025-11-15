<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

// Helper functions (те же что в update_user.php)
function getRoleId($roleName)
{
	$roleMap = [
		'admin' => 1,
		'client' => 2,
		'driver' => 3,
		'dispatcher' => 4
	];
	return $roleMap[$roleName] ?? null;
}

function createClient($con, $userId, $companyName)
{
	$insertQuery = "INSERT INTO clients (user_id, company_name) VALUES ($1, $2)";
	pg_query_params($con, $insertQuery, [$userId, $companyName]);
}

function createDriver($con, $userId, $licenseNumber)
{
	$insertQuery = "INSERT INTO drivers (user_id, license_number) VALUES ($1, $2)";
	pg_query_params($con, $insertQuery, [$userId, $licenseNumber]);
}

function createDispatcher($con, $userId)
{
	$insertQuery = "INSERT INTO dispatchers (user_id) VALUES ($1)";
	pg_query_params($con, $insertQuery, [$userId]);
}

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
		if (!in_array('admin', $userRoles)) {
			throw new Exception("Access denied: Admin privileges required");
		}

		$input = json_decode(file_get_contents('php://input'), true);

		if (!$input) {
			throw new Exception("Invalid JSON input");
		}

		// Validate required fields
		if (empty($input['username']) || empty($input['first_name']) || empty($input['last_name']) || empty($input['password'])) {
			throw new Exception("Username, first name, last name and password are required");
		}

		$con = getDBConnection();

		// Check if username already exists
		$checkQuery = "SELECT user_id FROM users WHERE username = $1";
		$checkResult = pg_query_params($con, $checkQuery, [$input['username']]);
		if (pg_num_rows($checkResult) > 0) {
			throw new Exception("Username already exists");
		}

		// Check if email already exists
		if (!empty($input['email'])) {
			$emailCheckQuery = "SELECT user_id FROM users WHERE email = $1";
			$emailCheckResult = pg_query_params($con, $emailCheckQuery, [$input['email']]);
			if (pg_num_rows($emailCheckResult) > 0) {
				throw new Exception("Email already exists");
			}
		}

		// Hash password
		$passwordHash = password_hash($input['password'], PASSWORD_DEFAULT);

		// Insert user
		$insertQuery = "INSERT INTO users (username, password_hash, first_name, last_name, middle_name, phone, email) 
                       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING user_id";
		$insertParams = [
			$input['username'],
			$passwordHash,
			$input['first_name'],
			$input['last_name'],
			$input['middle_name'] ?? null,
			$input['phone'] ?? null,
			$input['email'] ?? null
		];

		$result = pg_query_params($con, $insertQuery, $insertParams);

		if (!$result) {
			throw new Exception("Failed to create user: " . pg_last_error($con));
		}

		$userId = pg_fetch_result($result, 0, 'user_id');

		// Assign roles
		if (isset($input['roles']) && is_array($input['roles'])) {
			foreach ($input['roles'] as $role) {
				$roleId = getRoleId($role);
				if ($roleId) {
					$roleQuery = "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)";
					pg_query_params($con, $roleQuery, [$userId, $roleId]);
				}

				// Create specialized records
				if ($role === 'client') {
					createClient($con, $userId, $input['company_name'] ?? '');
				} elseif ($role === 'driver') {
					if (empty($input['license_number'])) {
						throw new Exception("License number is required for drivers");
					}
					createDriver($con, $userId, $input['license_number']);
				} elseif ($role === 'dispatcher') {
					createDispatcher($con, $userId);
				}
			}
		}

		echo json_encode([
			'status' => 'success',
			'message' => 'User created successfully',
			'user_id' => $userId
		]);

	} catch (Exception $e) {
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