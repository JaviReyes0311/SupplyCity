<?php
session_start();
if (isset($_SESSION['user_id'])) {
    echo $_SESSION['user_id'];
} else {
    header("HTTP/1.1 401 Unauthorized");
    echo '';
}
?>