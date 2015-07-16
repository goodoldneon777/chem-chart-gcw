<?php
ini_set('display_errors','On');

date_default_timezone_set('America/Chicago');

header('Content-Type: application/json');

$sql = json_decode($_POST["sql"]);
//$sql = " select x, y, heat, grade, roundX, cast( avg(y) over(partition by roundX) as decimal(10, 4) ) as avgY, count(y) over(partition by roundX) as countY, cast( stddev(y) over(partition by roundX) as decimal(10, 4) ) as stdevY from( select TGC_CASTHEAT.START_HEAT_DTS as x, TGC_CASTHEAT_CHEM.C as y, TGC_CASTHEAT.HEAT_ID as heat, TGC_CASTHEAT.FINAL_GRADE as grade, trunc(TGC_CASTHEAT.START_HEAT_DTS, 'DD') as roundX from AGC0001.TGC_CASTHEAT_CHEM TGC_CASTHEAT_CHEM inner join AGC0001.TGC_CASTHEAT TGC_CASTHEAT on TGC_CASTHEAT_CHEM.CAST_HEAT_SEQ_ID = TGC_CASTHEAT.CAST_HEAT_SEQ_ID where TGC_CASTHEAT.START_HEAT_DTS >= to_date('6/15/2015', 'mm/dd/yyyy') and TGC_CASTHEAT_CHEM.SAMPLE_ID = '26' ) where x is not null and y is not null order by x asc";

$serverName = "PUSWGC1.PSC.USS.COM";
$uid = "AGC_SELECT";
$pwd = "qwerty3";
$dbname = "AGC0001";

$db = "(DESCRIPTION=(ADDRESS_LIST=(ADDRESS=(PROTOCOL=TCP)(HOST=prod70.psc.uss.com)(PORT=1745)))(CONNECT_DATA=(SERVICE_NAME=puswgc1.psc.uss.com)))";


$conn = oci_connect( $uid, $pwd, $db );
if (!$conn) {
    $e = oci_error();
    trigger_error(htmlentities($e['message'], ENT_QUOTES), E_USER_ERROR);
}


$cursor=OCIParse($conn, 'ALTER SESSION SET NLS_DATE_FORMAT=\'YYYY-MM-DD HH24:MI:SS\''); 
OCIExecute($cursor); 
OCIFreeCursor($cursor);


// Prepare the statement
$stid = oci_parse($conn, $sql);
if (!$stid) {
    $e = oci_error($conn);
    trigger_error(htmlentities($e['message'], ENT_QUOTES), E_USER_ERROR);
}

// Run query
$r = oci_execute($stid);
if (!$r) {
    $e = oci_error($stid);
    trigger_error(htmlentities($e['message'], ENT_QUOTES), E_USER_ERROR);
}

// Fetch the results of the query
$data = array();
while( $r = oci_fetch_array($stid, OCI_NUM+OCI_RETURN_NULLS) ) {
    if ( isset($r[0]) ) {
        $date = date_create($r[0]);
        $r[0] = date_format($date, 'Y-m-d').'T'.date_format($date, 'H:i:s');
    }

    if ( isset($r[4]) ) {
        $date = date_create($r[4]);
        $r[4] = date_format($date, 'Y-m-d').'T'.date_format($date, 'H:i:s');
    }

    $row = array( $r[0], $r[1], $r[2], $r[3], $r[4], $r[5], $r[6], $r[7] );

    array_push($data, $row);
}



$obj = new stdClass();
$obj->data = $data;

echo json_encode($obj);


// oci_free_statement($stid);
oci_close($conn);


?>