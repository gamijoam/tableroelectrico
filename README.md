# Taller de Tableros

Editor web para diseñar cajas de breakers y tableros sobre riel DIN, ubicarlos en una pared,
cablearlos y probarlos con un simulador. Sin dependencias ni compilación: se abre `index.html`.

## Estructura

```
index.html          Marcado de la página y orden de carga de los scripts
css/styles.css      Estilos (tokens de color, claro/oscuro, vista Pared, animaciones)
js/util.js          Geometría base, gradientes SVG y ayudantes de dibujo (T, R, C, screw…)
js/din.js           Componentes de riel DIN: dibujos y catálogo
js/loadcenter.js    Caja de breakers: catálogo, fases, cálculo de corriente y AWG
js/equipment.js     Equipos externos (estabilizador, UPS, inversor, planta, ATS, transformador)
js/pricing.js       Precios de referencia en USD y formatos de moneda
js/state.js         Estado, plantillas, guardado local, deshacer y reglas de ubicación
js/render.js        Dibujo del tablero (DIN y caja de breakers) y rótulo del plano
js/panels.js        Biblioteca, panel de propiedades y presupuesto
js/sim.js           Simulador: redes, cortocircuitos, voltajes, sobrecargas y reglas de norma
js/routing.js       Recorrido de cables: por la tubería dibujada (camino más corto, un carril por cable) o en Z sin encimarse
js/wall.js          Vista Pared: varias paredes, dispositivos, cableado, tubería y panel de prueba
js/layout.js        Paneles laterales plegables, pantalla completa y alertas de la prueba
js/selbar.js        Barra flotante junto a lo seleccionado (amperaje, polos, encender, eliminar)
js/projects.js      Varios proyectos, archivo .json, datos de la empresa con logo y descargas
js/pdf.js           PDF carta: tablero, diagrama unifilar, cuadro de cargas con demanda, presupuesto y paredes
js/actions.js       Acciones del usuario, arrastrar y soltar, modales y barra de herramientas
js/main.js          Arranque
```

Los scripts son clásicos (no módulos) y comparten el ámbito global, así que el orden de
`index.html` importa: cada archivo usa lo definido en los anteriores.

## Simulador (js/sim.js)

Cada cable une dos terminales; los terminales unidos forman una red. Una red puede tener
fase (desde un breaker cerrado), neutro o tierra. Con eso detecta:

- Interruptores sencillos y de tres vías (escalera); llegadas de circuito en paredes sin tablero.
- Estabilizador, protector enchufable, UPS e inversor en línea; con "Simular apagón" los que tienen batería siguen alimentando su salida.
- Cortocircuito fase-neutro, fase-tierra y fase-fase: dispara el breaker.
- Sobrecarga por polo: avisa y dispara a los segundos.
- Aparato de 120 V conectado a 240 V: se quema. Aparato de 240 V con 120 V: funciona mal.
- GFCI: dispara si el neutro regresa por la tierra.
- Norma: neutro blanco, tierra verde, fases negro/rojo/azul; interruptor cortando el neutro;
  polaridad invertida en tomas; equipos sin tierra; calibre menor que el breaker.

Es una herramienta de enseñanza y presupuesto, no un cálculo según el Código Eléctrico Nacional.

## Dependencias

- jsPDF 2.5.1 desde cdnjs, solo para generar el PDF. Si no carga (sin internet), el resto de la app funciona igual.
