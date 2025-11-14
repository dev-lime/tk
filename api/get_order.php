<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Простая заглушка для тестирования
try {
	if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
		http_response_code(200);
		exit();
	}

	if (!isset($_GET['order_id'])) {
		http_response_code(400);
		echo json_encode([
			'status' => 'error',
			'message' => 'Order ID is required'
		]);
		exit;
	}

	$orderId = intval($_GET['order_id']);

	// Демо-данные
	$order = [
		'order_id' => $orderId,
		'origin' => 'New York, NY',
		'destination' => 'Los Angeles, CA',
		'status' => 'in_transit',
		'price' => '1500.00',
		'weight' => '500',
		'description' => 'Transportation of electronics and fragile items. Handle with care.',
		'created_at' => date('Y-m-d\TH:i:s', strtotime('-5 days')),
		'updated_at' => date('Y-m-d\TH:i:s', strtotime('-1 day')),
		'delivery_date' => date('Y-m-d', strtotime('+5 days')),
		'client_name' => 'John Smith',
		'client_email' => 'john.smith@example.com',
		'client_phone' => '+1-555-0123',
		'company_name' => 'Smith Enterprises LLC',
		'driver_name' => 'Mike Johnson',
		'vehicle_make' => 'Volvo',
		'vehicle_model' => 'FH16',
		'vehicle_plate' => 'ABC-123',
		'history' => [
			[
				'action' => 'created',
				'description' => 'Order was created by client',
				'created_at' => date('Y-m-d\TH:i:s', strtotime('-5 days'))
			],
			[
				'action' => 'confirmed',
				'description' => 'Order confirmed by dispatcher',
				'created_at' => date('Y-m-d\TH:i:s', strtotime('-4 days'))
			],
			[
				'action' => 'assigned',
				'description' => 'Driver Mike Johnson assigned to order',
				'created_at' => date('Y-m-d\TH:i:s', strtotime('-3 days'))
			],
			[
				'action' => 'status_change',
				'description' => 'Status changed to in_transit - shipment departed',
				'created_at' => date('Y-m-d\TH:i:s', strtotime('-1 day'))
			]
		]
	];

	echo json_encode([
		'status' => 'success',
		'order' => $order
	]);

} catch (Exception $e) {
	http_response_code(500);
	echo json_encode([
		'status' => 'error',
		'message' => $e->getMessage()
	]);
}
?>