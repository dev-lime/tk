<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET' || $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
	if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
		http_response_code(200);
		exit();
	}

	try {
		if (!isset($_SESSION['user']) || !isset($_SESSION['user']['roles'])) {
			throw new Exception("Access denied: User not authenticated");
		}

		$con = getDBConnection();

		$query = "SELECT u.user_id, u.first_name, u.last_name, c.company_name
                  FROM users u 
                  JOIN clients c ON u.user_id = c.user_id 
                  ORDER BY u.first_name, u.last_name";

		$result = pg_query($con, $query);

		if (!$result) {
			throw new Exception("Database query failed: " . pg_last_error($con));
		}

		$clients = [];
		while ($row = pg_fetch_assoc($result)) {
			$clients[] = $row;
		}

		echo json_encode([
			'status' => 'success',
			'clients' => $clients
		]);

	} catch (Exception $e) {
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