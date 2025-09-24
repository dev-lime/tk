<?php
require_once 'middleware.php';

setupAPI();

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