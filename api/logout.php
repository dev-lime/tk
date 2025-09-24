<?php
require_once 'middleware.php';

try {
	setupAPI();

	session_unset();
	session_destroy();

	echo json_encode([
		'status' => 'success',
		'message' => 'Logout successful'
	]);
} catch (Exception $e) {
	handleAPIError($e);
}
?>