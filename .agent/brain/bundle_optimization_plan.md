# Vercel Deployment Optimization

Reduce the serverless function size to stay within Vercel's 250MB (unzipped) limit.

## Proposed Changes

### [MODIFY] [.gitignore](file:///Users/alaschgari/berlin-open-data/.gitignore)
- Ignore the entire `data/raw/` directory to prevent large CSVs and Excel files from being bundled.
- Ignore specific large processed files if they are not needed by API routes at runtime (e.g., intermediate steps).

### [EXECUTION] Repository Cleanup
- Remove the `data/raw/` directory from git tracking (without deleting local files) to shrink the repository and deployment artifacts.
- `git rm -r --cached data/raw/`

### [PLANNING] Data Optimization
- Analyze `data/processed/financial_data.json` (37MB) and `data/processed/subsidies_data.json` (19MB).
- Consider stripping unnecessary fields or splitting them if certain API routes only need subsets.
- Check if we can use `compression` or more efficient data structures.

## Verification Plan

### Automated Tests
- Run `du -sh .` to verify local project size.
- Run `npm run build` locally.
- Use `ls -lh .next/server/app/api` to check the size of API route chunks.

### Manual Verification
- Deploy to Vercel and confirm successful build and deployment.
- Verify that all dashboard views still function correctly with optimized data.
