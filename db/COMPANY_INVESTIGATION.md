# Company ATS Investigation Template

When you find a new company to add or want to fix a broken handle, copy this
mini-form and fill it in, then paste the filled forms back to me (or send the
SQL directly).

## How to investigate (~3 min per company)

1. Open the company's careers page in your browser
2. Open DevTools → **Network** tab → reload the page
3. Look at the requests. The first 1–2 XHR / fetch requests usually go to the
   ATS. Look for URLs containing:

   | If you see…                         | ATS              | Handle is…                  |
   |-------------------------------------|------------------|-----------------------------|
   | `boards.greenhouse.io/{X}`          | `greenhouse`     | `{X}`                       |
   | `boards-api.greenhouse.io/v1/boards/{X}` | `greenhouse`| `{X}`                       |
   | `job-boards.greenhouse.io/{X}`      | `greenhouse`     | `{X}`                       |
   | `api.lever.co/v0/postings/{X}`      | `lever`          | `{X}`                       |
   | `jobs.lever.co/{X}`                 | `lever`          | `{X}`                       |
   | `api.ashbyhq.com/posting-api/job-board/{X}` | `ashby`  | `{X}`                       |
   | `jobs.ashbyhq.com/{X}`              | `ashby`          | `{X}`                       |
   | `api.smartrecruiters.com/v1/companies/{X}/postings` | `smartrecruiters` | `{X}` |
   | `careers.smartrecruiters.com/{X}`   | `smartrecruiters`| `{X}` (note case sensitive) |
   | `{host}.myworkdayjobs.com/wday/cxs/{tenant}/{site}` | `workday` | `{host}:{site}`     |
   | `{X}.icims.com/jobs/search`         | `icims`          | `{X}`                       |

4. If none of those show up → it's a `custom` ATS. We'd need to write a
   bespoke scraper (see "Custom scrapers" section below).

## Fill in:

```
Company name:    
ATS:             (greenhouse / lever / ashby / smartrecruiters / workday / icims / custom)
Handle:          
Careers URL:     
Notes:           (anything weird — paginated? requires login? Cloudflare bot check?)
```

## Bulk format (paste into Supabase SQL editor)

```sql
insert into companies (name, ats, ats_handle, careers_url, indexes) values
  ('CompanyA', 'ashby',      'companya',      'https://companya.com/careers', ARRAY['AI 50']),
  ('CompanyB', 'greenhouse', 'companyb-prod', 'https://companyb.com/careers', ARRAY['Early but Hot']),
  ('CompanyC', 'lever',      'companyc',      'https://jobs.companyc.com',     ARRAY['Public Tech']);
```

Indexes are an array; pick from: `'AI 50'`, `'Early but Hot'`, `'Public Tech'`, `'India-HQ'`. A company can be in multiple.

## Custom scrapers

For companies with no public ATS (Apple, Google, Meta, etc.), we write a
custom function in `scraper/src/customs/{company-slug}.ts` that:

1. Fetches their careers page or hidden JSON endpoint
2. Parses the response into `FetchedRole[]`
3. Returns the list

The framework is in place — see `scraper/src/customs/microsoft.ts` for a
worked example using the public JSON endpoint they expose.

To add a new custom scraper:

1. Investigate as above. Confirm there's NO standard ATS — only then is a
   custom scraper warranted.
2. Find their internal API endpoint via Network tab.
3. Drop a new file: `scraper/src/customs/{slug}.ts` exporting `fetch{Name}()`.
4. Register it in `scraper/src/customs/index.ts`.
5. Add the company row with `ats='custom'` and `ats_handle='{slug}'`.

Send me the API endpoint + a sample response and I'll write the scraper.
