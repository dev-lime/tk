<?php
require_once 'middleware.php';
require_once '../config/database.php';

try {
	setupAPI();
	$user = requireAuth();

	$con = getDBConnection();
	$query = "SELECT u.user_id, u.username, u.first_name, u.last_name, u.middle_name,
                     u.email, u.phone, u.created_at as registration_date
              FROM users u WHERE u.user_id = $1";

	$result = pg_query_params($con, $query, [$user['id']]);
	if (!$result || pg_num_rows($result) === 0) {
		throw new Exception("User not found");
	}

	$userData = pg_fetch_assoc($result);
	$userData['roles'] = $user['roles'];
	$userData['specialized_info'] = getUserSpecializedInfo($user['id']);

	echo json_encode([
		'status' => 'success',
		'user' => $userData
	]);

} catch (Exception $e) {
	handleAPIError($e);
}
?>