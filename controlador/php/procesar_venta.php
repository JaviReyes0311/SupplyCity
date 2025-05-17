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

    if (!isset($input['metodo_pago']) || !in_array($input['metodo_pago'], ['Efectivo', 'Tarjeta'])) {
        throw new Exception('Método de pago no válido', 400);
    }

    if (!isset($input['productos']) || !is_array($input['productos']) || empty($input['productos'])) {
        throw new Exception('Carrito vacío', 400);
    }

    // Verificar turno abierto
    $turno = $conn->query("SELECT Id_Turno FROM Turno WHERE Id_Usuario = {$_SESSION['user_id']} AND Estado = 'Abierto'")->fetch_assoc();
    if (!$turno) {
        throw new Exception('No hay un turno abierto', 400);
    }

    // Iniciar transacción
    $conn->begin_transaction();

    // 1. Crear la venta
    $stmtVenta = $conn->prepare("INSERT INTO Venta (Id_Turno, Total, Metodo_Pago) VALUES (?, 0, ?)");
    $stmtVenta->bind_param("is", $turno['Id_Turno'], $input['metodo_pago']);
    $stmtVenta->execute();
    $venta_id = $conn->insert_id;
    $stmtVenta->close();

    $total = 0;
    $stmtDetalle = $conn->prepare("INSERT INTO DetalleVenta (Id_Venta, Id_Producto, Cantidad, Precio_Unitario) VALUES (?, ?, ?, ?)");

    // 2. Procesar cada producto
    foreach ($input['productos'] as $item) {
        if (!isset($item['id']) || !isset($item['quantity'])) {
            continue;
        }

        $producto_id = intval($item['id']);
        $cantidad = intval($item['quantity']);

        // Obtener información del producto
        $producto = $conn->query("SELECT Precio, Stock FROM Producto WHERE Id_Producto = $producto_id AND Activo = 1")->fetch_assoc();
        if (!$producto) {
            throw new Exception("Producto ID $producto_id no disponible", 400);
        }

        // Verificar stock
        if ($producto['Stock'] < $cantidad) {
            throw new Exception("Stock insuficiente para el producto ID $producto_id", 400);
        }

        $precio = floatval($producto['Precio']);
        $subtotal = $precio * $cantidad;
        $total += $subtotal;

        // Registrar detalle
        $stmtDetalle->bind_param("iiid", $venta_id, $producto_id, $cantidad, $precio);
        $stmtDetalle->execute();

        // Actualizar stock (el trigger también lo hace, pero es doble validación)
        $conn->query("UPDATE Producto SET Stock = Stock - $cantidad WHERE Id_Producto = $producto_id");
    }

    $stmtDetalle->close();

    // 3. Actualizar total de la venta
    $conn->query("UPDATE Venta SET Total = $total WHERE Id_Venta = $venta_id");

    // 4. Actualizar totales del turno
    $campoTotal = $input['metodo_pago'] == 'Efectivo' ? 'Total_Efectivo' : 'Total_Tarjeta';
    $conn->query("UPDATE Turno SET $campoTotal = $campoTotal + $total WHERE Id_Turno = {$turno['Id_Turno']}");

    // 5. Limpiar carrito temporal
    $conn->query("DELETE FROM CarritoTemporal WHERE usuario_id = {$_SESSION['user_id']}");

    $conn->commit();
    echo json_encode(['success' => true, 'venta_id' => $venta_id, 'total' => $total]);

} catch (Exception $e) {
    if (isset($conn)) $conn->rollback();
    http_response_code($e->getCode() ?: 500);
    echo json_encode(['error' => $e->getMessage()]);
} finally {
    if (isset($conn)) $conn->close();
}
?>