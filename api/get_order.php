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

		if (!isset($_GET['order_id'])) {
			throw new Exception("Order ID is required");
		}

		$orderId = intval($_GET['order_id']);
		$con = getDBConnection();

		if (!$con) {
			throw new Exception("Database connection failed");
		}

		// Build corrected query based on your actual database structure
		$query = "SELECT 
                    o.order_id, 
                    o.origin, 
                    o.destination, 
                    o.cargo_description as description,
                    o.weight_kg as weight,
                    o.status, 
                    o.price, 
                    o.created_at, 
                    o.updated_at, 
                    o.delivery_date,
                    CONCAT(u.first_name, ' ', u.last_name) as client_name,
                    u.email as client_email, 
                    u.phone as client_phone,
                    c.company_name,
                    d.user_id as driver_id,
                    CONCAT(driver_u.first_name, ' ', driver_u.last_name) as driver_name,
                    d.license_number as driver_license,
                    v.vehicle_id,
                    v.plate_number as vehicle_plate, 
                    v.model as vehicle_model, 
                    v.capacity_kg as vehicle_capacity,
                    v.status as vehicle_status,
                    disp.user_id as dispatcher_id,
                    CONCAT(disp_u.first_name, ' ', disp_u.last_name) as dispatcher_name
                  FROM orders o 
                  JOIN clients c ON o.client_id = c.user_id
                  JOIN users u ON c.user_id = u.user_id 
                  LEFT JOIN drivers d ON o.driver_id = d.user_id
                  LEFT JOIN users driver_u ON d.user_id = driver_u.user_id
                  LEFT JOIN vehicles v ON o.vehicle_id = v.vehicle_id
                  LEFT JOIN dispatchers disp ON o.dispatcher_id = disp.user_id
                  LEFT JOIN users disp_u ON disp.user_id = disp_u.user_id
                  WHERE o.order_id = $1";

		$params = [$orderId];

		// If user is client, verify they own this order
		if (in_array('client', $userRoles) && !in_array('admin', $userRoles) && !in_array('dispatcher', $userRoles)) {
			$query .= " AND o.client_id = $2";
			$params[] = $_SESSION['user']['user_id'] ?? $_SESSION['user']['id'];
		}

		$result = pg_query_params($con, $query, $params);

		if (!$result) {
			throw new Exception("Database query failed: " . pg_last_error($con));
		}

		if (pg_num_rows($result) === 0) {
			throw new Exception("Order not found");
		}

		$order = pg_fetch_assoc($result);

		// Get order history/logs (если таблица существует)
		$history = [];
		$historyQuery = "SELECT action, description, created_at 
                        FROM order_history 
                        WHERE order_id = $1 
                        ORDER BY created_at DESC 
                        LIMIT 10";
		$historyResult = @pg_query_params($con, $historyQuery, [$orderId]);

		if ($historyResult) {
			while ($historyRow = pg_fetch_assoc($historyResult)) {
				$history[] = $historyRow;
			}
		}
		$order['history'] = $history;

		echo json_encode([
			'status' => 'success',
			'order' => $order
		]);

	} catch (Exception $e) {
		error_log("get_order.php error: " . $e->getMessage());
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