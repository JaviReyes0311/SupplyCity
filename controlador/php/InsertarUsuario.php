<?php
header('Content-Type: application/json');

// Configuración de la base de datos
$servername = "localhost";
$username = "root"; // Cambiar si es necesario
$password = ""; // Cambiar si es necesario
$dbname = "pos_db";

// Crear conexión
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexión
if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => 'Conexión fallida: ' . $conn->connect_error]));
}

// Obtener datos del formulario
$nombre = $_POST['nombre'] ?? '';
$apellido = $_POST['apellido'] ?? '';
$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';
$confirm_password = $_POST['confirm_password'] ?? '';
$tipo_usuario = 'Usuario'; // Siempre será usuario normal

// Validaciones básicas
if (empty($nombre) || empty($apellido) || empty($email) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Todos los campos son obligatorios']);
    exit;
}

if ($password !== $confirm_password) {
    echo json_encode(['success' => false, 'message' => 'Las contraseñas no coinciden']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'El email no es válido']);
    exit;
}

// Verificar si el email ya existe
$stmt = $conn->prepare("SELECT Email FROM Usuario WHERE Email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'El email ya está registrado']);
    $stmt->close();
    $conn->close();
    exit;
}
$stmt->close();

// Hash de la contraseña (usando SHA2 como en tus datos de prueba)
$hashed_password = hash('sha256', $password);

// Insertar nuevo usuario
$stmt = $conn->prepare("INSERT INTO Usuario (Email, Password, Nombre, Apellido, Tipo_Usuario) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("sssss", $email, $hashed_password, $nombre, $apellido, $tipo_usuario);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Usuario registrado exitosamente']);
} else {
    echo json_encode(['success' => false, 'message' => 'Error al registrar usuario: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>