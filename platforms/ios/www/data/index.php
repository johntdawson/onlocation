<?php

$file="locations.csv";
$csv= file_get_contents($file);
$array = array_map("str_getcsv", explode(",", $csv));
print json_encode($array);