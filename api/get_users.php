<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET' || $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {

	// Handle preflight request
	if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
		http_response_code(200);
		exit();
	}

	try {
		// Check permissions
		if (!isset($_SESSION['user']) || !isset($_SESSION['user']['roles'])) {
			throw new Exception("Access denied: User not authenticated");
		}

		$userRoles = $_SESSION['user']['roles'];
		$allowedRoles = ['admin', 'dispatcher'];

		if (!array_intersect($allowedRoles, $userRoles)) {
			throw new Exception("Access denied: Insufficient permissions");
		}

		$page = isset($_GET['page']) ? intval($_GET['page']) : 1;
		$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
		$offset = ($page - 1) * $limit;

		$search = isset($_GET['search']) ? trim($_GET['search']) : '';
		$roleFilter = isset($_GET['role']) ? trim($_GET['role']) : '';
		$sortField = isset($_GET['sort']) ? $_GET['sort'] : 'user_id';
		$sortOrder = isset($_GET['order']) ? $_GET['order'] : 'asc';

		// Validate sort field
		$allowedSortFields = ['user_id', 'username', 'first_name', 'last_name', 'email', 'created_at'];
		if (!in_array($sortField, $allowedSortFields)) {
			$sortField = 'user_id';
		}

		// Validate sort order
		$sortOrder = strtolower($sortOrder) === 'desc' ? 'DESC' : 'ASC';

		$con = getDBConnection();

		// Build base query
		$query = "SELECT u.user_id, u.username, u.first_name, u.last_name, u.email, u.phone, u.created_at 
                  FROM users u WHERE 1=1";
		$params = [];
		$paramCount = 0;

		if (!empty($search)) {
			$paramCount++;
			$query .= " AND (u.username ILIKE $$paramCount OR u.first_name ILIKE $$paramCount OR u.last_name ILIKE $$paramCount OR u.email ILIKE $$paramCount)";
			$searchTerm = "%$search%";
			$params[] = $searchTerm;
			$params[] = $searchTerm;
			$params[] = $searchTerm;
			$params[] = $searchTerm;
			$paramCount += 3; // Because we use the same parameter 4 times
		}

		if (!empty($roleFilter)) {
			$paramCount++;
			$query .= " AND EXISTS (SELECT 1 FROM user_roles ur 
                          JOIN roles r ON ur.role_id = r.role_id 
                          WHERE ur.user_id = u.user_id AND r.role_name = $$paramCount)";
			$params[] = $roleFilter;
		}

		// Count total
		$countQuery = "SELECT COUNT(*) as total FROM ($query) as filtered";
		$countResult = pg_query_params($con, $countQuery, $params);

		if (!$countResult) {
			throw new Exception("Database query failed: " . pg_last_error($con));
		}

		$totalCount = pg_fetch_result($countResult, 0, 'total');

		// Get data with sorting
		$query .= " ORDER BY $sortField $sortOrder LIMIT $limit OFFSET $offset";
		$result = pg_query_params($con, $query, $params);

		if (!$result) {
			throw new Exception("Database query failed: " . pg_last_error($con));
		}

		$users = [];
		while ($row = pg_fetch_assoc($result)) {
			// Get roles for each user
			$rolesQuery = "SELECT r.role_name FROM user_roles ur 
                          JOIN roles r ON ur.role_id = r.role_id 
                          WHERE ur.user_id = $1";
			$rolesResult = pg_query_params($con, $rolesQuery, [$row['user_id']]);

			$roles = [];
			while ($roleRow = pg_fetch_assoc($rolesResult)) {
				$roles[] = $roleRow['role_name'];
			}

			$row['roles'] = $roles;
			$users[] = $row;
		}

		echo json_encode([
			'status' => 'success',
			'users' => $users,
			'totalCount' => (int) $totalCount,
			'currentPage' => $page,
			'totalPages' => ceil($totalCount / $limit)
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