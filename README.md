# GM Electronics — catálogo mayorista

Primera versión del nuevo catálogo/order builder de GM Electronics.

## Stack
- React + Vite
- CSS propio, sin framework visual
- Catálogo alimentado desde `src/data/productos.json`

## Datos comerciales
- GM Electronics
- WhatsApp: 11 7823-4289
- Email: gonzalo.m.martin@gmail.com
- Zona Oeste
- Efectivo o transferencia
- Precios publicados sin IVA
- Sin descuentos por cantidad

## Pendientes de la siguiente iteración
1. Confirmar la tasa exacta de IVA para el cálculo de factura.
2. Definir si `embalaje` se muestra solamente como información o como mínimo comercial por producto.
3. Incorporar las imágenes reales por código.
4. Generar PDF de pedido.
5. Afinar checkout y envío de pedidos por WhatsApp/email.

## Catálogo y pedidos conectados a la API
- Web: https://gmelectronic2-0.vercel.app
- API: https://gm-electronics-api.onrender.com
- El JSON original permanece como referencia; la web obtiene precios y disponibilidad del catálogo publicado.
- Disponible por variante: verde confirmado. Amarillo o dato sin confirmar: Consultar disponibilidad. Precio ausente: Consultar precio.
- Catálogo paginado de 16 en 16, filtros por categoría y disponibilidad, búsqueda y ordenación completa por precio.
- Imágenes principales y galerías; elección de variante con su código y color.
- Carrito persistente y perfil guardado al elegir Guardar mis datos, en este navegador.
- IVA 21% solamente al solicitar factura. Embalaje informativo, sin mínimos por producto.
- Antes de enviar, la API vuelve a consultar la lista publicada, calcula importes en centavos y guarda la solicitud con número GM.
- Cada pedido es una solicitud sujeta a confirmación. La disponibilidad del proveedor no representa cantidades ni reserva.
- El PDF y WhatsApp usan el pedido guardado. El servidor de email recupera el pedido con su token privado; no acepta precios, totales ni PDFs arbitrarios del navegador.

### Correo
Configurar RESEND_API_KEY y EMAIL_FROM en Vercel. EMAIL_FROM debe corresponder a un remitente habilitado en Resend.
El destinatario comercial fijo es gonzalo.m.martin@gmail.com. Nunca colocar credenciales en variables VITE_ ni en el repositorio.
El correo conserva una clave por pedido para evitar duplicados al reintentar; se habilita el envío durante las primeras 23 horas de la solicitud.
Si falta el servicio de correo, el pedido queda guardado y el cliente dispone de WhatsApp y PDF.
GET /api/email-status informa únicamente si hay una credencial configurada; no confirma entrega.

### Validación
La API tiene diez pruebas locales que verifican catálogo, seguridad, precios, disponibilidad, ordenación global, IVA y reintentos simultáneos.
La construcción de la web se verifica en la vista previa de Vercel antes de publicar.
No se enviaron correos reales de prueba.
