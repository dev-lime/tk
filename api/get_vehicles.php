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
		$statusFilter = isset($_GET['status']) ? trim($_GET['status']) : '';
		$sortField = isset($_GET['sort']) ? $_GET['sort'] : 'vehicle_id';
		$sortOrder = isset($_GET['order']) ? $_GET['order'] : 'asc';

		// Validate sort field
		$allowedSortFields = ['vehicle_id', 'plate_number', 'model', 'capacity_kg', 'status'];
		if (!in_array($sortField, $allowedSortFields)) {
			$sortField = 'vehicle_id';
		}

		$sortOrder = strtolower($sortOrder) === 'desc' ? 'DESC' : 'ASC';

		$con = getDBConnection();

		// Build query
		$query = "SELECT vehicle_id, plate_number, model, capacity_kg, status FROM vehicles WHERE 1=1";
		$params = [];
		$paramCount = 0;

		if (!empty($search)) {
			$paramCount++;
			$query .= " AND (plate_number ILIKE $$paramCount OR model ILIKE $$paramCount)";
			$params[] = "%$search%";
		}

		if (!empty($statusFilter)) {
			$paramCount++;
			$query .= " AND status = $$paramCount";
			$params[] = $statusFilter;
		}

		// Count total
		$countQuery = "SELECT COUNT(*) as total FROM ($query) as filtered";
		$countResult = pg_query_params($con, $countQuery, $params);

		if (!$countResult) {
			throw new Exception("Database query failed: " . pg_last_error($con));
		}

		$totalCount = pg_fetch_result($countResult, 0, 'total');

		// Get data
		$query .= " ORDER BY $sortField $sortOrder LIMIT $limit OFFSET $offset";
		$result = pg_query_params($con, $query, $params);

		if (!$result) {
			throw new Exception("Database query failed: " . pg_last_error($con));
		}

		$vehicles = [];
		while ($row = pg_fetch_assoc($result)) {
			$vehicles[] = $row;
		}

		echo json_encode([
			'status' => 'success',
			'vehicles' => $vehicles,
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