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

function registerClient($userData)
{
	$con = getDBConnection();

	try {
		pg_query($con, "BEGIN");

		// Create user
		$userQuery = "INSERT INTO users (username, password_hash, last_name, first_name, middle_name, phone, email) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING user_id";

		$hashedPassword = password_hash($userData['password'], PASSWORD_DEFAULT);

		$userResult = pg_query_params($con, $userQuery, [
			$userData['username'],
			$hashedPassword,
			$userData['last_name'],
			$userData['first_name'],
			$userData['middle_name'] ?? null,
			$userData['phone'] ?? null,
			$userData['email'] ?? null
		]);

		if (!$userResult) {
			throw new Exception("User creation error");
		}

		$userId = pg_fetch_result($userResult, 0, 0);

		// Add client role
		$roleQuery = "INSERT INTO user_roles (user_id, role_id) 
                     VALUES ($1, (SELECT role_id FROM roles WHERE role_name = 'client'))";

		$roleResult = pg_query_params($con, $roleQuery, [$userId]);

		if (!$roleResult) {
			throw new Exception("Role assignment error");
		}

		// Create client record
		$clientQuery = "INSERT INTO clients (user_id, company_name) 
                       VALUES ($1, $2)";

		$clientResult = pg_query_params($con, $clientQuery, [
			$userId,
			$userData['company_name'] ?? null
		]);

		if (!$clientResult) {
			throw new Exception("Ошибка создания клиента");
		}

		pg_query($con, "COMMIT");

		return $userId;

	} catch (Exception $e) {
		pg_query($con, "ROLLBACK");
		throw $e;
	}
}

function checkUsernameExists($username)
{
	$con = getDBConnection();

	$query = "SELECT COUNT(*) FROM users WHERE username = $1";
	$result = pg_query_params($con, $query, [$username]);

	return pg_fetch_result($result, 0, 0) > 0;
}
?>