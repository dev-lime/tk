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
		$allowedRoles = ['admin', 'dispatcher', 'client'];

		if (!array_intersect($allowedRoles, $userRoles)) {
			throw new Exception("Access denied: Insufficient permissions");
		}

		$page = isset($_GET['page']) ? intval($_GET['page']) : 1;
		$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
		$offset = ($page - 1) * $limit;

		$search = isset($_GET['search']) ? trim($_GET['search']) : '';
		$statusFilter = isset($_GET['status']) ? trim($_GET['status']) : '';
		$dateFrom = isset($_GET['date_from']) ? trim($_GET['date_from']) : '';
		$dateTo = isset($_GET['date_to']) ? trim($_GET['date_to']) : '';
		$sortField = isset($_GET['sort']) ? $_GET['sort'] : 'order_id';
		$sortOrder = isset($_GET['order']) ? $_GET['order'] : 'desc';

		// Validate sort field
		$allowedSortFields = ['order_id', 'client_name', 'origin', 'destination', 'status', 'price', 'created_at'];
		if (!in_array($sortField, $allowedSortFields)) {
			$sortField = 'order_id';
		}

		$sortOrder = strtolower($sortOrder) === 'desc' ? 'DESC' : 'ASC';

		$con = getDBConnection();

		// Build query
		$query = "SELECT o.order_id, o.origin, o.destination, o.status, o.price, o.created_at,
                         CONCAT(u.first_name, ' ', u.last_name) as client_name
                  FROM orders o 
                  JOIN clients c ON o.client_id = c.user_id
                  JOIN users u ON c.user_id = u.user_id 
                  WHERE 1=1";
		$params = [];
		$paramCount = 0;

		// If user is client, show only their orders
		if (in_array('client', $userRoles) && !in_array('admin', $userRoles) && !in_array('dispatcher', $userRoles)) {
			$paramCount++;
			$query .= " AND o.client_id = $$paramCount";
			$params[] = $_SESSION['user']['id'];
		}

		if (!empty($search)) {
			$paramCount++;
			$query .= " AND (o.origin ILIKE $$paramCount OR o.destination ILIKE $$paramCount)";
			$params[] = "%$search%";
		}

		if (!empty($statusFilter)) {
			$paramCount++;
			$query .= " AND o.status = $$paramCount";
			$params[] = $statusFilter;
		}

		if (!empty($dateFrom)) {
			$paramCount++;
			$query .= " AND o.created_at >= $$paramCount";
			$params[] = $dateFrom;
		}

		if (!empty($dateTo)) {
			$paramCount++;
			$query .= " AND o.created_at <= $$paramCount";
			$params[] = $dateTo . ' 23:59:59';
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

		$orders = [];
		while ($row = pg_fetch_assoc($result)) {
			$orders[] = $row;
		}

		echo json_encode([
			'status' => 'success',
			'orders' => $orders,
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