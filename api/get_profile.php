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
                         u.email, u.phone, u.created_at as registration_date,
                         u.last_login
                  FROM users u 
                  WHERE u.user_id = $1";

		$result = pg_query_params($con, $query, [$userId]);

		if (!$result || pg_num_rows($result) === 0) {
			throw new Exception("User not found");
		}

		$user = pg_fetch_assoc($result);

		// Get user roles
		$rolesQuery = "SELECT r.role_name 
                       FROM user_roles ur 
                       JOIN roles r ON ur.role_id = r.role_id 
                       WHERE ur.user_id = $1";
		$rolesResult = pg_query_params($con, $rolesQuery, [$userId]);

		$roles = [];
		while ($row = pg_fetch_assoc($rolesResult)) {
			$roles[] = $row['role_name'];
		}

		$user['roles'] = $roles;
		$user['id'] = $user['user_id'];

		echo json_encode([
			'status' => 'success',
			'user' => $user
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