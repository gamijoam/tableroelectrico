/* main.js — arranque de la app: carga el último tablero guardado y dibuja todo. */
$("calc").onclick=calcDialog;$("fCalc").onclick=calcDialog;
load();renderLib();renderAll();requestAnimationFrame(fit);
if(freshStart&&prevBoard())showAlert("ok","Caja de breakers vacía","Empiezas con una caja vacía para poner los breakers que quieras. Tu tablero anterior no se borró: está en Proyectos → Recuperar tablero anterior.");
