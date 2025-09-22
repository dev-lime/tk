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
		$statusFilter = $_GET['status'] ?? '';
		$sortField = $_GET['sort'] ?? 'vehicle_id';
		$sortOrder = $_GET['order'] ?? 'asc';

		// Validate sort field
		$allowedSortFields = ['vehicle_id', 'plate_number', 'model', 'capacity_kg', 'status'];
		if (!in_array($sortField, $allowedSortFields)) {
			$sortField = 'vehicle_id';
		}

		$con = getDBConnection();

		// Build query
		$query = "SELECT vehicle_id, plate_number, model, capacity_kg, status FROM vehicles WHERE 1=1";
		$params = [];

		if (!empty($search)) {
			$query .= " AND (plate_number ILIKE $1 OR model ILIKE $1)";
			$params[] = "%$search%";
		}

		if (!empty($statusFilter)) {
			$query .= " AND status = $" . (count($params) + 1);
			$params[] = $statusFilter;
		}

		// Count total
		$countQuery = "SELECT COUNT(*) FROM ($query) as filtered";
		$countResult = pg_query_params($con, $countQuery, $params);
		$totalCount = pg_fetch_result($countResult, 0, 0);

		// Get data
		$query .= " ORDER BY $sortField $sortOrder LIMIT $limit OFFSET $offset";
		$result = pg_query_params($con, $query, $params);

		$vehicles = [];
		while ($row = pg_fetch_assoc($result)) {
			$vehicles[] = $row;
		}

		echo json_encode([
			'status' => 'success',
			'vehicles' => $vehicles,
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