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

$connectionInfo = array( "Database"=>"$dbname", "UID"=>"$uid", "PWD"=>"$pwd");
$conn = sqlsrv_connect( $serverName, $connectionInfo);

$data = array();


//$sql = $input->query;
//$sql = "select bop_ht.tap_st_dt, bop_ht.tap_oxy from USSGLW.dbo.bop_ht bop_ht where bop_ht.tap_yr >= '15' and bop_ht.tap_st_dt is not null and bop_ht.tap_oxy between 400 and 1500 order by bop_ht.tap_st_dt asc";

$stmt = sqlsrv_query( $conn, $sql );
if( $stmt === false) {
    die( print_r( sqlsrv_errors(), true) );
}


if ( $type === 'datetime' ) {
	while( $r = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_NUMERIC) ) {
		if ( isset($r[0]) ) {
  		$r[0] = date_format($r[0], 'Y-m-d').'T'.date_format($r[0], 'H:i:s');
  	}

  	if ( isset($r[3]) ) {
  		$r[3] = date_format($r[3], 'Y-m-d').'T'.date_format($r[3], 'H:i:s');
  	}

    $row = array( $r[0], $r[1], $r[2], $r[3], $r[4], $r[5], $r[6] );

    array_push($data, $row);
  }
  
} else {
	while( $r = sqlsrv_fetch_array( $stmt, SQLSRV_FETCH_NUMERIC) ) {
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



//echo json_encode($data);
echo json_encode($obj);


sqlsrv_close($conn);




// $db = mysqli_connect("localhost", "data_chart_rw", "steel87", "data_chart");
// $db = mysqli_connect("localhost", "root", "steel87", "data_chart");

// if (mysqli_connect("localhost", "root", "steel87", "data_chart")) {

// }

// if (mysqli_connect_errno()) {
//   exit();
// }


?>