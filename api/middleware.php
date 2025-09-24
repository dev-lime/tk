<?php
/**
 * API Middleware - общие функции для всех endpoints
 */

// Автозагрузка сессии и CORS headers
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

// Проверка аутентификации пользователя
function requireAuth($allowedRoles = [])
{
	if (!isset($_SESSION['user']) || !$_SESSION['user']['logged_in']) {
		http_response_code(401);
		echo json_encode(['status' => 'error', 'message' => 'Authentication required']);
		exit();
	}

	if (!empty($allowedRoles)) {
		$userRoles = $_SESSION['user']['roles'] ?? [];
		if (!array_intersect($allowedRoles, $userRoles)) {
			http_response_code(403);
			echo json_encode(['status' => 'error', 'message' => 'Insufficient permissions']);
			exit();
		}
	}

	return $_SESSION['user'];
}

// Обработка ошибок API
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

// Проверка метода запроса
function requireMethod($allowedMethods)
{
	if (!in_array($_SERVER['REQUEST_METHOD'], (array) $allowedMethods)) {
		throw new Exception('Method not allowed', 405);
	}
}
?>