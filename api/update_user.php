<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

// Helper functions
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

function updateClient($con, $userId, $companyName)
{
	// Check if client exists
	$checkQuery = "SELECT 1 FROM clients WHERE user_id = $1";
	$checkResult = pg_query_params($con, $checkQuery, [$userId]);

	if (pg_num_rows($checkResult) > 0) {
		// Update existing
		$updateQuery = "UPDATE clients SET company_name = $1 WHERE user_id = $2";
		pg_query_params($con, $updateQuery, [$companyName, $userId]);
	} else {
		// Insert new
		$insertQuery = "INSERT INTO clients (user_id, company_name) VALUES ($1, $2)";
		pg_query_params($con, $insertQuery, [$userId, $companyName]);
	}
}

function updateDriver($con, $userId, $licenseNumber)
{
	if (empty($licenseNumber)) {
		throw new Exception("License number is required for drivers");
	}

	$checkQuery = "SELECT 1 FROM drivers WHERE user_id = $1";
	$checkResult = pg_query_params($con, $checkQuery, [$userId]);

	if (pg_num_rows($checkResult) > 0) {
		$updateQuery = "UPDATE drivers SET license_number = $1 WHERE user_id = $2";
		pg_query_params($con, $updateQuery, [$licenseNumber, $userId]);
	} else {
		$insertQuery = "INSERT INTO drivers (user_id, license_number) VALUES ($1, $2)";
		pg_query_params($con, $insertQuery, [$userId, $licenseNumber]);
	}
}

function updateDispatcher($con, $userId)
{
	$checkQuery = "SELECT 1 FROM dispatchers WHERE user_id = $1";
	$checkResult = pg_query_params($con, $checkQuery, [$userId]);

	if (pg_num_rows($checkResult) === 0) {
		$insertQuery = "INSERT INTO dispatchers (user_id) VALUES ($1)";
		pg_query_params($con, $insertQuery, [$userId]);
	}
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

		// Get JSON input
		$input = json_decode(file_get_contents('php://input'), true);

		if (!$input) {
			throw new Exception("Invalid JSON input");
		}

		if (!isset($input['user_id'])) {
			throw new Exception("User ID is required");
		}

		$userId = intval($input['user_id']);
		$con = getDBConnection();

		if (!$con) {
			throw new Exception("Database connection failed");
		}

		// Build update query
		$updateFields = [];
		$params = [];
		$paramCount = 1;

		$allowedFields = ['username', 'email', 'first_name', 'last_name', 'middle_name', 'phone'];

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

		$params[] = $userId;

		$query = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE user_id = \${$paramCount}";

		error_log("Update query: " . $query);
		error_log("Params: " . print_r($params, true));

		$result = pg_query_params($con, $query, $params);

		if (!$result) {
			throw new Exception("Database update failed: " . pg_last_error($con));
		}

		// Update roles if provided
		if (isset($input['roles']) && is_array($input['roles'])) {
			// Delete existing roles
			pg_query_params($con, "DELETE FROM user_roles WHERE user_id = $1", [$userId]);

			// Insert new roles
			foreach ($input['roles'] as $role) {
				$roleId = getRoleId($role);
				if ($roleId) {
					$roleQuery = "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)";
					$roleResult = pg_query_params($con, $roleQuery, [$userId, $roleId]);
					if (!$roleResult) {
						throw new Exception("Failed to assign role: " . pg_last_error($con));
					}
				}

				// Handle specialized tables
				if ($role === 'client') {
					updateClient($con, $userId, $input['company_name'] ?? '');
				} elseif ($role === 'driver') {
					if (empty($input['license_number'])) {
						throw new Exception("License number is required for drivers");
					}
					updateDriver($con, $userId, $input['license_number']);
				} elseif ($role === 'dispatcher') {
					updateDispatcher($con, $userId);
				}
			}

			// Remove from specialized tables if role was removed
			if (!in_array('client', $input['roles'])) {
				pg_query_params($con, "DELETE FROM clients WHERE user_id = $1", [$userId]);
			}
			if (!in_array('driver', $input['roles'])) {
				pg_query_params($con, "DELETE FROM drivers WHERE user_id = $1", [$userId]);
			}
			if (!in_array('dispatcher', $input['roles'])) {
				pg_query_params($con, "DELETE FROM dispatchers WHERE user_id = $1", [$userId]);
			}
		}

		echo json_encode([
			'status' => 'success',
			'message' => 'User updated successfully'
		]);

	} catch (Exception $e) {
		error_log("update_user.php error: " . $e->getMessage());
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