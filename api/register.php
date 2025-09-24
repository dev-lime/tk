<?php
require_once 'middleware.php';
require_once '../config/database.php';

try {
	setupAPI();

	if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
		throw new Exception('Invalid request method', 405);
	}

	$input = json_decode(file_get_contents('php://input'), true);

	$requiredFields = ['username', 'password', 'first_name', 'last_name'];
	foreach ($requiredFields as $field) {
		if (!isset($input[$field]) || empty(trim($input[$field]))) {
			throw new Exception("Field {$field} is required");
		}
	}

	if (checkUsernameExists($input['username'])) {
		throw new Exception("The username is already taken");
	}

	if (strlen($input['password']) < 6) {
		throw new Exception("The password must contain at least 6 characters");
	}

	$userId = registerClient($input);

	echo json_encode([
		'status' => 'success',
		'message' => 'Registration successful. You can now login.',
		'user_id' => $userId
	]);

} catch (Exception $e) {
	handleAPIError($e, 400);
}
?>