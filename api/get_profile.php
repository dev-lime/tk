<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
	try {
		if (!isset($_SESSION['user']) || $_SESSION['user']['logged_in'] !== true) {
			throw new Exception("User not authenticated");
		}

		$userId = $_SESSION['user']['id'];

		// Get detailed user information
		$con = getDBConnection();
		$query = "SELECT u.user_id, u.username, u.first_name, u.last_name, u.middle_name, 
                         u.email, u.phone, u.created_at as registration_date
                  FROM users u 
                  WHERE u.user_id = $1";

		$result = pg_query_params($con, $query, [$userId]);

		if (!$result || pg_num_rows($result) === 0) {
			throw new Exception("User not found");
		}

		$user = pg_fetch_assoc($result);

		// Get user roles
		$roles = getUserRoles($userId);

		// Get specialized info
		$specializedInfo = getUserSpecializedInfo($userId);

		// Prepare response
		$userData = [
			'id' => $user['user_id'],
			'username' => $user['username'],
			'first_name' => $user['first_name'],
			'last_name' => $user['last_name'],
			'middle_name' => $user['middle_name'],
			'email' => $user['email'],
			'phone' => $user['phone'],
			'registration_date' => $user['registration_date'],
			'roles' => $roles,
			'specialized_info' => $specializedInfo
		];

		echo json_encode([
			'status' => 'success',
			'user' => $userData
		]);

	} catch (Exception $e) {
		echo json_encode([
			'status' => 'error',
			'message' => $e->getMessage()
		]);
	}
} else {
	echo json_encode([
		'status' => 'error',
		'message' => 'Invalid request method'
	]);
}
?>