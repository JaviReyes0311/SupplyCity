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
    header("Location: ../../vista/HTML/login.html?error=Error de conexión a la base de datos");
    exit;
}

// Obtener datos del formulario
$email = $_POST['email'] ?? '';
$input_password = $_POST['password'] ?? '';

// Validación básica
if (empty($email) || empty($input_password)) {
    header("Location: ../../vista/HTML/login.html?error=Por favor complete todos los campos");
    exit;
}

// Consulta preparada para obtener usuario
$stmt = $conn->prepare("SELECT Id_Usuario, Password, Tipo_Usuario, Activo FROM Usuario WHERE Email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    header("Location: ../../vista/HTML/login.html?error=Usuario no encontrado");
    exit;
}

$user = $result->fetch_assoc();

// Verificar contraseña (SHA-256)
if (hash('sha256', $input_password) === $user['Password']) {
    if (!$user['Activo']) {
        header("Location: ../../vista/HTML/login.html?error=Cuenta desactivada");
        exit;
    }

    // ACTUALIZAR ÚLTIMO LOGIN
    $update_stmt = $conn->prepare("UPDATE Usuario SET Ultimo_Login = NOW() WHERE Id_Usuario = ?");
    $update_stmt->bind_param("i", $user['Id_Usuario']);
    $update_stmt->execute();
    $update_stmt->close();

    // Configurar sesión
    $_SESSION['user_id'] = $user['Id_Usuario'];
    $_SESSION['user_type'] = $user['Tipo_Usuario'];
    $_SESSION['loggedin'] = true;
    
    // Generar token seguro para el frontend
    $token = bin2hex(random_bytes(16));
    $_SESSION['token'] = $token;
    
    // Redirigir al dashboard
    header("Location: ../../vista/HTML/caseback.html?user_id=".$user['Id_Usuario']."&token=".$token);
    exit;
} else {
    header("Location: ../../vista/HTML/login.html?error=Contraseña incorrecta");
    exit;
}

$stmt->close();
$conn->close();
?>