<?php
header('Content-Type: application/json');
require_once 'conexion.php';

try {
    $query = "SELECT p.Email AS user, p.Fecha_Creacion, p.Tipo_Usuario 
                FROM usuario p
                ORDER BY p.Id_Usuario;";

    $result = $conn->query($query);

    if (!$result) {
        throw new Exception("Error en la consulta: " . $conn->error);
    }

    $productos = [];
    while ($row = $result->fetch_assoc()) {
        $Users[] = [
            'user' => $row['user'],
            'Fecha_Creacion' => $row['Fecha_Creacion'],
            'Tipo_Usuario' => $row['Tipo_Usuario'],
        ];
    }

    echo json_encode($Users);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
} finally {
    if (isset($conn)) $conn->close();
}
?>