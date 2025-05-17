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

    // Validar datos recibidos
    if (!isset($input['user_id']) || $input['user_id'] != $_SESSION['user_id']) {
        throw new Exception('ID de usuario no válido', 403);
    }

    if (!isset($input['productos']) || !is_array($input['productos'])) {
        throw new Exception('Estructura de productos inválida', 400);
    }

    // Iniciar transacción
    $conn->begin_transaction();

    // Limpiar carrito anterior
    $stmt = $conn->prepare("DELETE FROM CarritoTemporal WHERE usuario_id = ?");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();

    // Insertar nuevos items
    $stmt = $conn->prepare("INSERT INTO CarritoTemporal (usuario_id, producto_id, cantidad) VALUES (?, ?, ?)");
    
    foreach ($input['productos'] as $item) {
        // Validar cada producto
        if (!isset($item['id']) || !isset($item['quantity'])) {
            continue;
        }

        $producto_id = intval($item['id']);
        $cantidad = intval($item['quantity']);

        // Verificar que el producto existe y está activo
        $check = $conn->query("SELECT Id_Producto FROM Producto WHERE Id_Producto = $producto_id AND Activo = 1");
        if ($check->num_rows > 0 && $cantidad > 0) {
            $stmt->bind_param("iii", $_SESSION['user_id'], $producto_id, $cantidad);
            $stmt->execute();
        }
    }

    $conn->commit();
    echo json_encode(['success' => true, 'count' => count($input['productos'])]);

} catch (Exception $e) {
    if ($conn) $conn->rollback();
    http_response_code($e->getCode() ?: 500);
    echo json_encode(['error' => $e->getMessage()]);
} finally {
    if (isset($stmt)) $stmt->close();
    if (isset($conn)) $conn->close();
}
?>