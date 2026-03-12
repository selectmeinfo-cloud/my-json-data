<?php
// files.php — root లో ఉంటుంది, data/ folder లో అన్ని .json files scan చేస్తుంది
// ?category=astrology పంపిస్తే ఆ category files మాత్రమే return అవుతాయి
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$dir   = __DIR__ . '/data';
$files = glob($dir . '/*.json');
$list  = [];

// Query param నుండి category తీసుకో
$filterCat = isset($_GET['category']) ? trim($_GET['category']) : '';

foreach ($files as $f) {
    $name = basename($f);
    if (in_array($name, ['index.json', 'manifest.json'])) continue;

    // Category filter ఉంటే — JSON చదివి category match చేయి
    if ($filterCat !== '') {
        $data = @json_decode(file_get_contents($f), true);
        if (!$data) continue;
        $artCat = isset($data['category']) ? strtolower(trim($data['category'])) : '';
        $filterNorm = strtolower(trim($filterCat));
        if ($artCat !== $filterNorm) continue;
    }

    $list[] = $name;
}

// Published date వరుసలో sort చేయి (latest first)
usort($list, function($a, $b) use ($dir) {
    $da = @json_decode(file_get_contents($dir . '/' . $a), true);
    $db = @json_decode(file_get_contents($dir . '/' . $b), true);
    $ta = isset($da['published_date']) ? strtotime($da['published_date']) : 0;
    $tb = isset($db['published_date']) ? strtotime($db['published_date']) : 0;
    return $tb - $ta;
});

echo json_encode(['files' => $list]);

?>