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
		if (!isset($_SESSION['user']) || !array_intersect(['admin', 'dispatcher', 'client'], $_SESSION['user']['roles'])) {
			throw new Exception("Access denied");
		}

		$page = $_GET['page'] ?? 1;
		$limit = $_GET['limit'] ?? 10;
		$offset = ($page - 1) * $limit;

		$search = $_GET['search'] ?? '';
		$statusFilter = $_GET['status'] ?? '';
		$dateFrom = $_GET['date_from'] ?? '';
		$dateTo = $_GET['date_to'] ?? '';
		$sortField = $_GET['sort'] ?? 'order_id';
		$sortOrder = $_GET['order'] ?? 'desc';

		// Validate sort field
		$allowedSortFields = ['order_id', 'client_name', 'origin', 'destination', 'status', 'price', 'created_at'];
		if (!in_array($sortField, $allowedSortFields)) {
			$sortField = 'order_id';
		}

		$con = getDBConnection();

		// Build query
		$query = "SELECT o.order_id, o.origin, o.destination, o.status, o.price, o.created_at,
                         CONCAT(u.first_name, ' ', u.last_name) as client_name
                  FROM orders o 
                  JOIN clients c ON o.client_id = c.user_id
                  JOIN users u ON c.user_id = u.user_id 
                  WHERE 1=1";
		$params = [];

		// If user is client, show only their orders
		if (in_array('client', $_SESSION['user']['roles']) && !in_array('admin', $_SESSION['user']['roles']) && !in_array('dispatcher', $_SESSION['user']['roles'])) {
			$query .= " AND o.client_id = $" . (count($params) + 1);
			$params[] = $_SESSION['user']['id'];
		}

		if (!empty($search)) {
			$query .= " AND (o.origin ILIKE $" . (count($params) + 1) . " OR o.destination ILIKE $" . (count($params) + 1) . ")";
			$params[] = "%$search%";
		}

		if (!empty($statusFilter)) {
			$query .= " AND o.status = $" . (count($params) + 1);
			$params[] = $statusFilter;
		}

		if (!empty($dateFrom)) {
			$query .= " AND o.created_at >= $" . (count($params) + 1);
			$params[] = $dateFrom;
		}

		if (!empty($dateTo)) {
			$query .= " AND o.created_at <= $" . (count($params) + 1);
			$params[] = $dateTo . ' 23:59:59';
		}

		// Count total
		$countQuery = "SELECT COUNT(*) FROM ($query) as filtered";
		$countResult = pg_query_params($con, $countQuery, $params);
		$totalCount = pg_fetch_result($countResult, 0, 0);

		// Get data
		$query .= " ORDER BY $sortField $sortOrder LIMIT $limit OFFSET $offset";
		$result = pg_query_params($con, $query, $params);

		$orders = [];
		while ($row = pg_fetch_assoc($result)) {
			$orders[] = $row;
		}

		echo json_encode([
			'status' => 'success',
			'orders' => $orders,
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