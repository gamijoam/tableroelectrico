/* main.js — arranque de la app: carga el último tablero guardado y dibuja todo. */
load();renderLib();renderAll();requestAnimationFrame(fit);
if(freshStart&&prevBoard())showAlert("ok","Caja de breakers vacía","Empiezas con una caja vacía para poner los breakers que quieras. Tu tablero anterior no se borró: está en Guardar / abrir → Recuperar tablero anterior.");
