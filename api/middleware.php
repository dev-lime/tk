<?php
/**
 * API Middleware - common functions for all endpoints
 */

function setupAPI()
{
	session_start();
	header('Content-Type: application/json');
	header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
	header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
	header('Access-Control-Allow-Headers: Content-Type, Authorization');
	header('Access-Control-Allow-Credentials: true');

	// Handle preflight OPTIONS request
	if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
		http_response_code(200);
		exit();
	}
}

function requireAuth($allowedRoles = [])
{
	if (!isset($_SESSION['user']) || !$_SESSION['user']['logged_in']) {
		http_response_code(401);
		echo json_encode(['status' => 'error', 'message' => 'Authentication required']);
		exit();
	}

	if (!empty($allowedRoles)) {
		$userRoles = $_SESSION['user']['roles'] ?? [];
		$hasAccess = false;

		foreach ($allowedRoles as $role) {
			if (in_array($role, $userRoles)) {
				$hasAccess = true;
				break;
			}
		}

		if (!$hasAccess) {
			http_response_code(403);
			echo json_encode([
				'status' => 'error',
				'message' => 'Access denied. Required roles: ' . implode(', ', $allowedRoles)
			]);
			exit();
		}
	}

	return $_SESSION['user'];
}

function handleAPIError(Exception $e, $code = 500)
{
	error_log("API Error: " . $e->getMessage());
	http_response_code($code);
	echo json_encode([
		'status' => 'error',
		'message' => $e->getMessage(),
		'timestamp' => date('Y-m-d H:i:s')
	]);
	exit();
}
?>