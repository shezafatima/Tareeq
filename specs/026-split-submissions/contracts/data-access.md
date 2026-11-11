# Contract: data access (026)

## Pure modules (unit-tested, no server imports)

| Module | Exports |
|---|---|
| `src/lib/admin/leads-params.ts` | `LEAD_TYPES`, `LEAD_STATUS_VALUES`, `PAGE_SIZE`, `SEARCH_MAX`, `parseLeadParams(type, raw)`, `leadsHref(type, params)`, `clampPage`, `escapeRegex`, `isObjectId` |
| `src/lib/admin/leads-filter.ts` | `workshopFilter(p)`, `courseFilter(p, liveCourseIds: string[] \| null)`; both always include `type` |
| `src/lib/admin/lead-status.ts` | `statusLabels(type)` |
| `src/lib/admin/course-leads.ts` | `categoryFor(lead, courseById)`, `courseLinkFor(courseId, courseById)`, `categoryOptions(current, snapshots)`, `courseOptions(courses)` |
| `src/lib/admin/whatsapp.ts` | `whatsappLink(phone, fullName, topic)` |

## Server-only reads: `src/lib/admin/leads-query.ts`

Every function is scoped to one type (by name, or by taking `type` first; `getNewCounts` groups by type), and every filter includes it. The list read is split into `listWorkshopLeads` / `listCourseLeads` (implementation note: clearer row types than one overloaded `listLeads`).

| Function | Returns | Query |
|---|---|---|
| `listWorkshopLeads(p)` | `{ rows: WorkshopRow[], total, page, pages }` | `find(workshopFilter(p)).sort({createdAt:-1,_id:-1})`, 25 per page |
| `listCourseLeads(p, lookup)` | `{ rows: CourseRow[], total, page, pages }` | `find(courseFilter(p, ids))`, rows given category via `categoryFor` |
| `getLeadStats(type)` | `StatusCounts` | `aggregate([{ $match:{type} }, { $group: status }])` |
| `getLead(type, id, lookup?)` | `LeadDetail \| null` | `findOne({ _id:id, type })`; null for malformed id or wrong type |
| `getNewCounts()` | `{ workshop, course }` | `aggregate([{ $match:{status:"new"} }, { $group: type }])` |
| `getWorkshopMonths()` | `string[]` | `distinct("preferredMonth", { type:"workshop", preferredMonth:{ $ne:null } })`, sorted desc |
| `getCourseLeadLookup()` | `{ courseById, courseOptions, categoryOptions, courseIdsByCategory }` | `listAllCourses()`, `listAllCategories()`, snapshot aggregate (`$match:{type:"course", categoryId:{$type:"string"}}`) |

All page reads go through `safeLoad`, and on failure the page shows `UnavailableNotice`. The panel layout loads `getNewCounts()` through `safeLoad`, and on failure shows no badges.

## Server-only write helper: `src/lib/leads/category-snapshot.ts`

```ts
readCategorySnapshot(courseId: string): Promise<{ categoryId: string|null; categoryName: string|null } | {}>
```

| Input | Result |
|---|---|
| `"not-sure"` | `{ categoryId:null, categoryName:null }` (no query) |
| course found, category found | `{ categoryId, categoryName }` |
| course or category not found / malformed id | `{ categoryId:null, categoryName:null }` |
| database error | `{}`, with the error name logged; the registration still saves |
