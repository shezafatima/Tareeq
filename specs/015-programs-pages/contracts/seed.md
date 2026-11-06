# Contract: Seed Command

```text
npm run seed:programs
→ tsx --conditions=react-server scripts/seed-programs.ts
```

**Settings**: `dotenv` loads `.env.local` without overriding the environment, so `MONGODB_URI="<uri>" npm run seed:programs` targets another database. Only `MONGODB_URI` is required.

**Behaviour**:

1. Validate every seed entry against the schema. On any error, write nothing.
2. Connect through `connectDb()` from `src/lib/db/mongoose.ts`, then run `Program.init()`.
3. For each entry, upsert by slug with `$setOnInsert` only and `timestamps: false`.
4. Disconnect.

**Guarantee**: an existing document is never modified, including `updatedAt`. A deleted document is recreated. Re-running is always safe.

**Output**:

```text
Database: tareeq_dev
Created 4, already existed 0
```

| Case | Exit code | Output |
|---|---|---|
| Success, including nothing to do | 0 | As above |
| `MONGODB_URI` missing or invalid | 1 | `Missing or invalid server settings: MONGODB_URI` |
| Database unreachable | 1 | Error name and a one-line hint; no connection string |
| Seed entry fails validation | 1 | Slug and field name; nothing written |

**Note**: the seed does not refresh a running site's cache. Seed before deploying. A site that is already running picks up new programs through its hourly refresh, or through tags once the admin feature exists.
