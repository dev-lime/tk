<?php
function getDBConnection()
{
	$con = pg_connect('host=localhost port=5432 dbname=tk user=postgres password=123');
	if (!$con) {
		throw new Exception("Database connection error");
	}
	return $con;
}

// User verification function
function authenticateUser($username, $password)
{
	$con = getDBConnection();

	$query = "SELECT user_id, username, password_hash, first_name, last_name 
              FROM users WHERE username = $1";
	$result = pg_query_params($con, $query, [$username]);

	if (!$result) {
		throw new Exception("Ошибка выполнения запроса");
	}

	if (pg_num_rows($result) === 0) {
		return false;
	}

	$user = pg_fetch_assoc($result);

	// Check password
	if (password_verify($password, $user['password_hash'])) {
		return $user;
	}

	return false;
}

// Function for getting user roles
function getUserRoles($userId)
{
	$con = getDBConnection();

	$query = "SELECT r.role_name 
              FROM user_roles ur 
              JOIN roles r ON ur.role_id = r.role_id 
              WHERE ur.user_id = $1";
	$result = pg_query_params($con, $query, [$userId]);

	$roles = [];
	while ($row = pg_fetch_assoc($result)) {
		$roles[] = $row['role_name'];
	}

	return $roles;
}
?>