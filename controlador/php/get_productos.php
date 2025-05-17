<?php
header('Content-Type: application/json');
require_once 'conexion.php';

try {
    $query = "SELECT 
                p.Id_Producto as id, 
                p.Nombre, 
                p.Descripcion, 
                p.Precio, 
                p.Stock,
                c.Nombre as categoria
              FROM Producto p
              JOIN Categoria c ON p.Id_Categoria = c.Id_Categoria
              WHERE p.Activo = 1
              ORDER BY p.Nombre";

    $result = $conn->query($query);

    if (!$result) {
        throw new Exception("Error en la consulta: " . $conn->error);
    }

    $productos = [];
    while ($row = $result->fetch_assoc()) {
        $productos[] = [
            'id' => $row['id'],
            'nombre' => $row['Nombre'],
            'descripcion' => $row['Descripcion'],
            'precio' => floatval($row['Precio']),
            'stock' => intval($row['Stock']),
            'categoria' => $row['categoria']
        ];
    }

    echo json_encode($productos);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
} finally {
    if (isset($conn)) $conn->close();
}
?>