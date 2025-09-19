<?php
function getDBConnection()
{
	$con = pg_connect('host=localhost port=5432 dbname=tk user=postgres password=123');
	if (!$con) {
		throw new Exception("Database connection error");
	}
	return $con;
}
?>