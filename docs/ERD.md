# Entity-Relationship Model — TZW FEMS

## Mermaid ERD

```mermaid
erDiagram
    ROLES ||--o{ USERS : "has"
    USERS ||--o{ REFRESH_TOKENS : "owns"
    USERS ||--o{ INSPECTIONS : "assigned as inspector"
    USERS ||--o{ MAINTENANCE_LOGS : "performs"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ AUDIT_LOGS : "acts in"
    FIRE_EXTINGUISHERS ||--o{ INSPECTIONS : "is inspected in"
    FIRE_EXTINGUISHERS ||--o{ MAINTENANCE_LOGS : "is serviced in"

    ROLES {
        uuid id PK
        enum name "ADMIN|INSPECTOR|USER (unique)"
        string description
    }
    USERS {
        uuid id PK
        string first_name
        string last_name
        string email "unique"
        string password_hash
        boolean is_active
        string phone
        uuid role_id FK
        string reset_token_hash
        datetime reset_token_expiry
    }
    REFRESH_TOKENS {
        uuid id PK
        uuid user_id FK
        string token_hash
        datetime expires_at
        boolean revoked
    }
    FIRE_EXTINGUISHERS {
        uuid id PK
        string serial_number "unique"
        string location
        enum type "WATER|CO2|FOAM|DRY_CHEMICAL"
        enum size "LBS_2_5|LBS_5|LBS_9|LBS_12"
        datetime installation_date
        datetime expiry_date
        enum status "ACTIVE|DUE_FOR_INSPECTION|EXPIRED|UNDER_MAINTENANCE|OUT_OF_SERVICE"
    }
    INSPECTIONS {
        uuid id PK
        uuid extinguisher_id FK
        uuid inspector_id FK
        datetime scheduled_at
        enum status "SCHEDULED|IN_PROGRESS|COMPLETED|CANCELLED"
        string notes
        datetime completed_at
    }
    MAINTENANCE_LOGS {
        uuid id PK
        uuid extinguisher_id FK
        uuid inspector_id FK
        string action_taken
        datetime action_date
        string condition_notes
        string recommendations
    }
    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        enum channel "EMAIL|IN_APP"
        string subject
        string body
        enum status "PENDING|SENT|FAILED|READ"
        json metadata
    }
    AUDIT_LOGS {
        uuid id PK
        uuid user_id FK
        string action
        string entity
        string entity_id
        json metadata
        string ip_address
    }
```

## Relationships summary

| Parent | Child | Cardinality | FK | On delete |
|---|---|---|---|---|
| `roles` | `users` | 1 → N | `users.role_id` | restrict |
| `users` | `refresh_tokens` | 1 → N | `refresh_tokens.user_id` | cascade |
| `users` | `inspections` | 1 → N | `inspections.inspector_id` | restrict |
| `users` | `maintenance_logs` | 1 → N | `maintenance_logs.inspector_id` | restrict |
| `users` | `notifications` | 1 → N | `notifications.user_id` | cascade |
| `fire_extinguishers` | `inspections` | 1 → N | `inspections.extinguisher_id` | cascade |
| `fire_extinguishers` | `maintenance_logs` | 1 → N | `maintenance_logs.extinguisher_id` | cascade |

## Indexes (performance)

* `users(email)` unique, `users(role_id)`
* `fire_extinguishers(serial_number)` unique, `(status)`, `(type)`
* `inspections(extinguisher_id)`, `(inspector_id)`, `(status)`
* `maintenance_logs(extinguisher_id)`, `(inspector_id)`
* `refresh_tokens(user_id)`; `notifications(user_id)`, `(status)`

The canonical definition lives in [`prisma/schema.prisma`](../prisma/schema.prisma).
