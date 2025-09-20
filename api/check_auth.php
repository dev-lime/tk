<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (isset($_SESSION['user']) && $_SESSION['user']['logged_in'] === true) {
	echo json_encode([
		'status' => 'success',
		'authenticated' => true,
		'user' => $_SESSION['user']
	]);
} else {
	echo json_encode([
		'status' => 'success',
		'authenticated' => false
	]);
}
?>