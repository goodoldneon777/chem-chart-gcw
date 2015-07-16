<?php
header('Content-Type: application/json');

$sql = json_decode($_POST["sql"]);
$type = json_decode($_POST["type"]);


// Initial variables for log.
$now = date("Y-m-d G:i:s");
$startString = $now;
$start = strtotime($now);



$serverName = "uss-stlsvr.glw.uss.com";
$uid = "gsm_ro";
$pwd = "stlmakero";
$dbname = "USSGLW";


$conn = mssql_connect( $serverName, $uid, $pwd );

if($conn === false) {
	die( print_r( 'Unable to connect to server.', true) );
}

mssql_select_db($dbname, $conn);
mssql_select_db('Alloy_Model', $conn);




//$sql = $input->query;
//$sql = "select bop_ht.tap_st_dt, bop_ht.tap_oxy from USSGLW.dbo.bop_ht bop_ht where bop_ht.tap_yr >= '15' and bop_ht.tap_st_dt is not null and bop_ht.tap_oxy between 400 and 1500 order by bop_ht.tap_st_dt asc";

$stmt = mssql_query( $sql );
if( $stmt === false) {
    //die( print_r( sqlsrv_errors(), true) );
    die( print_r( 'There was a SQL error.', true) );
}



$data = array();

if ( $type === 'datetime' ) {
	while( $r = mssql_fetch_array($stmt, MSSQL_NUM) ) {
		if ( isset($r[0]) ) {
			$date = date_create($r[0]);
  		$r[0] = date_format($date, 'Y-m-d').'T'.date_format($date, 'H:i:s');
  	}

  	if ( isset($r[3]) ) {
  		$date = date_create($r[3]);
  		$r[3] = date_format($date, 'Y-m-d').'T'.date_format($date, 'H:i:s');
  	}

    $row = array( $r[0], $r[1], $r[2], $r[3], $r[4], $r[5], $r[6] );

    array_push($data, $row);
  }
  
} else {
	while( $r = mssql_fetch_array($stmt, MSSQL_NUM) ) {
	      $row = array( $r[0], $r[1], $r[2], $r[3], $r[4], $r[5], $r[6] );
	      array_push($data, $row);
	}
}



// Get end datetime for log.
$now = date("Y-m-d G:i:s");
$end = strtotime($now);
$duration = $end - $start;


$obj = new stdClass();
$obj->data = $data;
$obj->startTime = $startString;
$obj->duration = $duration;
$obj->user = gethostbyaddr($_SERVER['REMOTE_ADDR']);
$obj->ip = $_SERVER['REMOTE_ADDR'];


echo json_encode($obj);




mssql_close($conn);


?>