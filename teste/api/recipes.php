<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$file = 'recipes.json';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($file)) {
        echo file_get_contents($file);
    } else {
        echo json_encode([]);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if ($data) {
        $current_data = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
        
        // Add ID if not present (simple auto-increment simulation)
        if (!isset($data['id'])) {
            $maxId = 0;
            foreach ($current_data as $recipe) {
                if ($recipe['id'] > $maxId) $maxId = $recipe['id'];
            }
            $data['id'] = $maxId + 1;
        }
        
        // Initialize likes if not present
        if (!isset($data['likes'])) {
            $data['likes'] = 0;
        }

        $current_data[] = $data;
        file_put_contents($file, json_encode($current_data, JSON_PRETTY_PRINT));
        echo json_encode(["message" => "Receita adicionada com sucesso!", "recipe" => $data]);
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Dados inválidos"]);
    }
}
?>
