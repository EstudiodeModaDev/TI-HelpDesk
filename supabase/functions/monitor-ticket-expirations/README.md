# monitor-ticket-expirations

Edge Function de Supabase para monitorear tickets vencidos y próximos a vencer en `TBL_Ticket_Solvi`.

## Arquitectura

- La función consulta tickets `En Atención` o `En Atencion`.
- Excluye tickets asignados a `Automatizaciones`.
- Valida horario Colombia (`America/Bogota`), fin de semana y festivos nacionales antes de procesar.
- Si el ticket venció, cambia el estado a `Fuera de tiempo`, crea seguimiento y envía correo por Microsoft Graph.
- Si faltan menos de 4 horas, envía alerta preventiva y registra seguimiento solo después del envío exitoso.

## Manejo de festivos

Se implementó cálculo local de festivos de Colombia sin depender de APIs externas:

- Festivos fijos.
- Festivos trasladables por Ley Emiliani.
- Festivos móviles calculados desde Pascua: Jueves Santo, Viernes Santo, Ascensión, Corpus Christi y Sagrado Corazón.

Esto evita caídas por servicios externos y mantiene el comportamiento estable en cron.

## Prevención de duplicados

La estrategia elegida es deduplicar con `TBL_Seguimientos_Solvi`.

- `Cambio automático a Fuera de tiempo`: sirve como trazabilidad del cambio automático.
- `Alerta automática de vencimiento`: evita enviar múltiples alertas del mismo ticket en ejecuciones sucesivas.

Se eligió esta opción porque no requiere cambiar el esquema actual de `TBL_Ticket_Solvi`, mantiene auditoría funcional y escala bien con índices por ticket/tipo de acción.

## Secrets requeridos

```bash
supabase secrets set SUPABASE_URL=...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
supabase secrets set AZURE_TENANT_ID=...
supabase secrets set AZURE_CLIENT_ID=...
supabase secrets set SOLVI_CLIENT_SECRET=...
supabase secrets set SOLVI_MAILBOX_USER=...
```

Opcionales:

```bash
supabase secrets set TICKET_WARNING_THRESHOLD_HOURS=4
supabase secrets set TICKET_MONITOR_PAGE_SIZE=200
```

Compatibilidad adicional:

- Si `AZURE_CLIENT_ID` no existe todavía, la función también acepta `SOLVI_CLIENT_ID`.

## Deploy

```bash
supabase functions deploy monitor-ticket-expirations
```

## Cron cada 25 minutos

```sql
select cron.schedule(
  'monitor-ticket-expirations',
  '*/25 * * * *',
  $$
  select net.http_post(
    url := 'https://PROJECT.supabase.co/functions/v1/monitor-ticket-expirations',
    headers := '{"Authorization":"Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```
