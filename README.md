# Sistema de Informes Médicos — Electrofisiología

Aplicación web 100% estática (sin servidor, sin base de datos) para registrar
procedimientos de electrofisiología y generar informes con formato.

- **Abre `index.html`** y trabaja: formulario por pestañas o asistente paso a paso.
- **Vista Previa** genera el informe; **Copiar Informe** lo deja en el portapapeles
  con formato (listo para pegar en Medicap conservando colores y tablas).
- **Imprimir** usa el menú del navegador (formato carta).

## Persistencia y privacidad

- Todo se guarda **localmente en el navegador** (`localStorage`): datos comunes,
  procedimientos, personal, plantillas y el informe en curso.
- **Ninguna información viaja a un servidor** y ningún dato de paciente se
  ingresa: el informe final se pega en el sistema institucional, que cuenta con
  los estándares de seguridad correspondientes.
- **Respaldo**: botón "Respaldar datos" (guardar JSON) e "Importar" para
  restaurar. Se sugiere respaldar al menos una vez por semana.

## Instalación / actualizaciones

- **URL publicada**: https://electrofisiohigueras.github.io/informes-electrofisiologia/
- La app es una **PWA**: el navegador ofrece "Instalar app" (icono en el
  escritorio o celular) y funciona **sin internet** después de la primera
  carga. Al publicar una versión nueva en el repo, la app se actualiza sola
  al refrescar la página (la versión visible en el header indica el nivel).
- La copia local alternativa sigue funcionando abriendo `index.html`
  directo (sin service worker ni catálogos por la web).
- Los catálogos compartidos (comunas, previsiones, diagnósticos, dispositivos)
  se publican en `data.json`; cada usuario puede traerlos al día con
  **Opciones → Datos Comunes → Restaurar catálogos**.

## Técnico

- Vanilla JS (16 módulos `js/` cargados en orden, sin build), Tailwind CSS y
  Font Awesome incluidos localmente en `vendor/` (no requiere internet).
- Catálogos base editables en `data.json`; las mediciones por defecto viven
  allí y en `js/01-data.js` (fallback para uso offline sin servidor).
- PWA: `manifest.json` + `sw.js` (precache de assets, network-first para
  `data.json`). Versión del caché en `SW_VERSION`; al publicar cambios de
  código bump de `APP_VERSION` (js/01-data.js) y de `SW_VERSION` (sw.js).
- Publicar una nueva versión: editar → commit en `main` → push; GitHub Pages
  despliega automáticamente en ~1 minuto.
