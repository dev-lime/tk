<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

try {
	$con = getDBConnection();

	$response = [
		'status' => 'success',
		'message' => 'Connection to the database has been successfully established',
		'database' => [
			'name' => 'tk',
			'host' => 'localhost',
			'port' => '5432',
			'user' => 'postgres'
		],
		'timestamp' => date('Y-m-d H:i:s')
	];

	pg_close($con);

} catch (Exception $e) {
	$response = [
		'status' => 'error',
		'message' => $e->getMessage(),
		'timestamp' => date('Y-m-d H:i:s')
	];
}

echo json_encode($response, JSON_UNESCAPED_UNICODE);
?>