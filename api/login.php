<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
	try {
		$input = json_decode(file_get_contents('php://input'), true);

		if (!isset($input['username']) || !isset($input['password'])) {
			throw new Exception("Username and password are required");
		}

		$username = trim($input['username']);
		$password = trim($input['password']);

		$user = authenticateUser($username, $password);

		if ($user) {
			// Getting user roles
			$roles = getUserRoles($user['user_id']);

			// Saving it to the session
			$_SESSION['user'] = [
				'id' => $user['user_id'],
				'username' => $user['username'],
				'first_name' => $user['first_name'],
				'last_name' => $user['last_name'],
				'roles' => $roles,
				'logged_in' => true
			];

			echo json_encode([
				'status' => 'success',
				'message' => 'Login successful',
				'user' => [
					'first_name' => $user['first_name'],
					'last_name' => $user['last_name'],
					'roles' => $roles
				]
			]);
		} else {
			echo json_encode([
				'status' => 'error',
				'message' => 'Invalid username or password'
			]);
		}

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