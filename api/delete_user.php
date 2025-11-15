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
		if (!in_array('admin', $userRoles)) {
			throw new Exception("Access denied: Admin privileges required");
		}

		$input = json_decode(file_get_contents('php://input'), true);

		if (!$input || !isset($input['user_id'])) {
			throw new Exception("User ID is required");
		}

		$userId = intval($input['user_id']);
		$con = getDBConnection();

		// Check if user exists
		$checkQuery = "SELECT username FROM users WHERE user_id = $1";
		$checkResult = pg_query_params($con, $checkQuery, [$userId]);

		if (!$checkResult || pg_num_rows($checkResult) === 0) {
			throw new Exception("User not found");
		}

		$user = pg_fetch_assoc($checkResult);

		// Start transaction
		pg_query($con, "BEGIN");

		try {
			// Delete from specialized tables first
			pg_query_params($con, "DELETE FROM clients WHERE user_id = $1", [$userId]);
			pg_query_params($con, "DELETE FROM drivers WHERE user_id = $1", [$userId]);
			pg_query_params($con, "DELETE FROM dispatchers WHERE user_id = $1", [$userId]);

			// Delete user roles
			pg_query_params($con, "DELETE FROM user_roles WHERE user_id = $1", [$userId]);

			// Delete user
			pg_query_params($con, "DELETE FROM users WHERE user_id = $1", [$userId]);

			// Commit transaction
			pg_query($con, "COMMIT");

			echo json_encode([
				'status' => 'success',
				'message' => 'User deleted successfully'
			]);

		} catch (Exception $e) {
			// Rollback transaction on error
			pg_query($con, "ROLLBACK");
			throw $e;
		}

	} catch (Exception $e) {
		error_log("delete_user.php error: " . $e->getMessage());
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