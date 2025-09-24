<?php
require_once 'middleware.php';
require_once '../config/database.php';

try {
	setupAPI();

	if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
		throw new Exception('Invalid request method', 405);
	}

	$input = json_decode(file_get_contents('php://input'), true);

	if (!isset($input['username']) || !isset($input['password'])) {
		throw new Exception("Username and password are required");
	}

	$username = trim($input['username']);
	$password = trim($input['password']);

	$user = authenticateUser($username, $password);

	if ($user) {
		$roles = getUserRoles($user['user_id']);

		$specializedInfo = getUserSpecializedInfo($user['user_id']);

		$_SESSION['user'] = [
			'id' => $user['user_id'],
			'username' => $user['username'],
			'first_name' => $user['first_name'],
			'last_name' => $user['last_name'],
			'middle_name' => $user['middle_name'],
			'email' => $user['email'],
			'phone' => $user['phone'],
			'created_at' => $user['created_at'],
			'roles' => $roles,
			'specialized_info' => $specializedInfo,
			'logged_in' => true
		];

		echo json_encode([
			'status' => 'success',
			'message' => 'Login successful',
			'user' => $_SESSION['user']
		]);
	} else {
		http_response_code(401);
		echo json_encode([
			'status' => 'error',
			'message' => 'Invalid username or password'
		]);
	}

} catch (Exception $e) {
	$code = $e->getCode() ?: 500;
	handleAPIError($e, $code);
}
?>