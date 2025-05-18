<?php
header('Content-Type: application/json');
require_once 'conexion.php';

try {
    $query = "SELECT p.Id_Producto AS ID, p.Nombre, p.Precio, p.Stock, p.Id_Categoria, p.Activo
              FROM producto p
              ORDER BY p.Id_Producto;";

    $result = $conn->query($query);

    if (!$result) {
        throw new Exception("Error en la consulta: " . $conn->error);
    }

    $productos = [];
    while ($row = $result->fetch_assoc()) {
        $productos[] = [
            'ID' => $row['ID'],
            'Nombre' => $row['Nombre'],
            'Precio' => $row['Precio'],
            'Stock' => $row['Stock'],
            'Id_Categoria' => $row['Id_Categoria'],
            'Activo' => (bool)$row['Activo']
        ];
    }

    echo json_encode($productos); // Corregido de $Users a $productos

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
} finally {
    if (isset($conn)) $conn->close();
}
?>