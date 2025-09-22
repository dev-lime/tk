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

		$requiredFields = ['username', 'password', 'first_name', 'last_name'];
		foreach ($requiredFields as $field) {
			if (!isset($input[$field]) || empty(trim($input[$field]))) {
				throw new Exception("Field {$field} required to fill");
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
			'message' => 'Registration is successful. You can enter now.',
			'user_id' => $userId
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