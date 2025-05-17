<?php
session_start();

// Configuración de la base de datos
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "pos_db";

// Crear conexión
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexión
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Configurar charset
$conn->set_charset("utf8mb4");

// Función para obtener el ID de usuario de forma segura
function obtenerUserId() {
    if (!isset($_SESSION['user_id'])) {
        header("HTTP/1.1 401 Unauthorized");
        die(json_encode(['error' => 'Usuario no autenticado']));
    }
    return $_SESSION['user_id'];
}
?>