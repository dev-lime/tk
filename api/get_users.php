<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
	try {
		// Check permissions
		if (!isset($_SESSION['user']) || !array_intersect(['admin', 'dispatcher'], $_SESSION['user']['roles'])) {
			throw new Exception("Access denied");
		}

		$page = $_GET['page'] ?? 1;
		$limit = $_GET['limit'] ?? 10;
		$offset = ($page - 1) * $limit;

		$search = $_GET['search'] ?? '';
		$roleFilter = $_GET['role'] ?? '';
		$sortField = $_GET['sort'] ?? 'user_id';
		$sortOrder = $_GET['order'] ?? 'asc';

		// Validate sort field
		$allowedSortFields = ['user_id', 'username', 'first_name', 'last_name', 'email', 'created_at'];
		if (!in_array($sortField, $allowedSortFields)) {
			$sortField = 'user_id';
		}

		$con = getDBConnection();

		// Build query
		$query = "SELECT u.user_id, u.username, u.first_name, u.last_name, u.email, u.phone, u.created_at 
                  FROM users u WHERE 1=1";
		$params = [];
		$paramCount = 0;

		if (!empty($search)) {
			$paramCount++;
			$query .= " AND (u.username ILIKE $%d OR u.first_name ILIKE $%d OR u.last_name ILIKE $%d OR u.email ILIKE $%d)";
			$searchTerm = "%$search%";
			$params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm]);
		}

		if (!empty($roleFilter)) {
			$paramCount++;
			$query .= " AND EXISTS (SELECT 1 FROM user_roles ur 
                          JOIN roles r ON ur.role_id = r.role_id 
                          WHERE ur.user_id = u.user_id AND r.role_name = $%d)";
			$params[] = $roleFilter;
		}

		// Count total
		$countQuery = "SELECT COUNT(*) FROM ($query) as filtered";
		$countResult = pg_query_params($con, $countQuery, $params);
		$totalCount = pg_fetch_result($countResult, 0, 0);

		// Get data
		$query .= " ORDER BY $sortField $sortOrder LIMIT $limit OFFSET $offset";
		$result = pg_query_params($con, $query, $params);

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
			'currentPage' => (int) $page,
			'totalPages' => ceil($totalCount / $limit)
		]);

	} catch (Exception $e) {
		echo json_encode([
			'status' => 'error',
			'message' => $e->getMessage()
		]);
	}
}
?>