<?php
/**
 * Database helper functions - расширенные функции для работы с БД
 */
require_once '../config/database.php';

// Универсальная функция для пагинации и фильтрации
function executePaginatedQuery($baseQuery, $countQuery, $params = [], $limit = 10, $page = 1, $orderBy = 'id', $order = 'ASC')
{
	$con = getDBConnection();

	// Получаем общее количество
	$countResult = pg_query_params($con, $countQuery, $params);
	if (!$countResult)
		throw new Exception("Count query failed: " . pg_last_error($con));
	$totalCount = (int) pg_fetch_result($countResult, 0, 0);

	// Добавляем сортировку и пагинацию
	$offset = ($page - 1) * $limit;
	$dataQuery = $baseQuery . " ORDER BY $orderBy $order LIMIT $limit OFFSET $offset";

	$dataResult = pg_query_params($con, $dataQuery, $params);
	if (!$dataResult)
		throw new Exception("Data query failed: " . pg_last_error($con));

	// Собираем результаты
	$data = [];
	while ($row = pg_fetch_assoc($dataResult)) {
		$data[] = $row;
	}

	return [
		'data' => $data,
		'totalCount' => $totalCount,
		'currentPage' => $page,
		'totalPages' => ceil($totalCount / $limit)
	];
}

// Проверка прав доступа клиента (только свои заказы)
function applyClientFilter($userId, $userRoles)
{
	if (in_array('client', $userRoles) && !array_intersect(['admin', 'dispatcher'], $userRoles)) {
		return " AND o.client_id = " . (int) $userId;
	}
	return "";
}

// Функция для получения колонок из результата
function pg_fetch_all_columns($result, $column = 0)
{
	$columns = [];
	while ($row = pg_fetch_row($result)) {
		$columns[] = $row[$column];
	}
	return $columns;
}
?>