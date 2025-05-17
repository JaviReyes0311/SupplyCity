<?php
session_start();
require_once 'conexion.php';

header('Content-Type: application/json');

try {
    // Validar sesión
    if (!isset($_SESSION['user_id'])) {
        throw new Exception('Acceso no autorizado', 401);
    }

    // Obtener datos del cuerpo de la petición
    $input = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Datos JSON inválidos', 400);
    }

    if (!isset($input['productos']) || !is_array($input['productos'])) {
        throw new Exception('Estructura de productos inválida', 400);
    }

    $productosSinStock = [];
    $conn->begin_transaction();

    foreach ($input['productos'] as $item) {
        if (!isset($item['id']) || !isset($item['quantity'])) {
            continue;
        }

        $producto_id = intval($item['id']);
        $cantidad = intval($item['quantity']);

        // Verificar stock
        $producto = $conn->query("
            SELECT Id_Producto, Nombre, Stock 
            FROM Producto 
            WHERE Id_Producto = $producto_id AND Activo = 1
        ")->fetch_assoc();

        if (!$producto) {
            $productosSinStock[] = [
                'id' => $producto_id,
                'error' => 'Producto no disponible'
            ];
        } elseif ($producto['Stock'] < $cantidad) {
            $productosSinStock[] = [
                'id' => $producto_id,
                'nombre' => $producto['Nombre'],
                'stock_disponible' => $producto['Stock'],
                'solicitado' => $cantidad,
                'error' => 'Stock insuficiente'
            ];
        }
    }

    $conn->commit();

    if (!empty($productosSinStock)) {
        throw new Exception('Algunos productos no tienen stock suficiente', 400, $productosSinStock);
    }

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    if (isset($conn)) $conn->rollback();
    
    $response = ['error' => $e->getMessage()];
    if ($e->getCode() == 400 && !empty($e->getPrevious())) {
        $response['productos'] = $e->getPrevious();
    }
    
    http_response_code($e->getCode() ?: 500);
    echo json_encode($response);
} finally {
    if (isset($conn)) $conn->close();
}
?>