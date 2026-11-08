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
js/panelsrc.js      El tablero en la pared, sea caja de breakers o riel DIN: protecciones, tornillos y barras
js/control.js       Mando de motores: bornes de contactor, térmico, relé, temporizador, pulsadores,
                    pilotos y supervisor; qué contactos cierran; motor trifásico
js/flow.js          Flujo de energía animado, lectura de cada borne, multímetro y diagnóstico de por qué no funciona
js/touch.js         Pantallas táctiles: desplazar con el dedo, pellizcar para zoom, avance automático al arrastrar
js/calc.js          Calculadora: breaker, cable, tubo y caída de tensión; arranque de motores; estabilizador,
                    UPS e inversor con baterías; demanda de la casa, principal, acometida y circuitos
js/mobile.js        Teléfono y tablet vertical: menú ☰, barra inferior y paneles como hojas desde abajo
js/info.js          Ficha de cada elemento: para qué sirve, cómo funciona, cómo se conecta, errores y si se simula
js/wall.js          Vista Pared: varias paredes, dispositivos, cableado, tubería y panel de prueba
js/layout.js        Paneles laterales plegables, pantalla completa y alertas de la prueba
js/selbar.js        Barra flotante junto a lo seleccionado (amperaje, polos, encender, eliminar)
js/projects.js      Varios proyectos, archivo .json, datos de la empresa con logo y descargas
js/pdf.js           PDF carta: tablero, diagrama unifilar, cuadro de cargas con demanda, presupuesto y paredes
js/unifilar.js      Diagrama unifilar del riel DIN (por orden de montaje) y visor del unifilar
js/share.js         Mis precios (guardados para todos los proyectos) y envío por WhatsApp
js/pwa.js           Botón Instalar app y avisos de conexión
sw.js               Guarda la app en el dispositivo para usarla sin internet
manifest.webmanifest, icons/  Datos e íconos de la app instalada
fonts/, vendor/     Fuentes y jsPDF servidos desde la app (sin depender de internet)
js/actions.js       Acciones del usuario, arrastrar y soltar, modales y barra de herramientas
js/main.js          Arranque
```

Los scripts son clásicos (no módulos) y comparten el ámbito global, así que el orden de
`index.html` importa: cada archivo usa lo definido en los anteriores.

## Simulador (js/sim.js)

Cada cable une dos terminales; los terminales unidos forman una red. Una red puede tener
fase (desde un breaker cerrado), neutro o tierra. Con eso detecta:

- Interruptores sencillos y de tres vías (escalera); llegadas de circuito en paredes sin tablero.
- Acometida opcional: con ella la corriente entra cableada (L1, L2, L3, N, T) a la entrada del principal o del riel
  (con peine opcional) y recorre cada protección; un corto antes de las protecciones quema los fusibles de la compañía.
- Estabilizador, protector enchufable, UPS e inversor en línea; con "Simular apagón" los que tienen batería siguen alimentando su salida.
- Cortocircuito fase-neutro, fase-tierra y fase-fase: dispara el breaker.
- Sobrecarga por polo: avisa y dispara a los segundos.
- Aparato de 120 V conectado a 240 V: se quema. Aparato de 240 V con 120 V: funciona mal.
- GFCI: dispara si el neutro regresa por la tierra.
- Norma: neutro blanco, tierra verde, fases negro/rojo/azul; interruptor cortando el neutro;
  polaridad invertida en tomas; equipos sin tierra; calibre menor que el breaker.
- Mando de motores en el tablero de riel (js/control.js): bobinas A1-A2 con su voltaje (poco voltaje no cierra,
  mucho la quema), retención con el auxiliar 13-14, pulsadores que se mantienen presionados, paro de emergencia
  enclavable, selector, temporizador con retardo real, pilotos y supervisor de fases (falta de fase, secuencia).
  El mando se resuelve por pasos hasta que ninguna bobina cambia; si oscila, avisa que el contactor vibra.
- Relé térmico: mide la corriente del motor y dispara antes que el breaker; abre 95-96 y cierra 97-98.
- Motor trifásico: gira con tres fases, gira al revés si se cruzan dos y con falta de fase consume 1,7 veces más
  (sin relé térmico se quema).

Durante la prueba, "Ver flujo de energía" anima cada cable que lleva corriente (amarillo por la fase,
celeste de regreso por el neutro, más rápido con más corriente) y resalta los que tienen tensión sin corriente.
Al tocar un aparato se ve qué recibe en cada borne, su voltaje, corriente y potencia, y por qué no funciona
(qué borne no llega y qué lo corta: breaker apagado, interruptor abierto, contacto del mando). El modo
Multímetro mide el voltaje entre dos terminales cualesquiera.

Es una herramienta de enseñanza y presupuesto, no un cálculo según el Código Eléctrico Nacional.

## Dependencias

- jsPDF 2.5.1 (licencia MIT) en `vendor/`, para generar el PDF.
- Fuentes Barlow Condensed, IBM Plex Sans e IBM Plex Mono (licencia SIL OFL) en `fonts/`.

No carga nada de internet: después de la primera visita la app funciona sin conexión.
Si agregas archivos, corre `python3 scripts/sw-files.py` (la acción de GitHub Pages ya lo hace al publicar).
