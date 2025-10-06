# Update NPM Packages Command

Please update NPM packages following this systematic approach:

## Phase 1: Assessment

1. Run `npm outdated` to identify out-of-date packages
2. Run `npm audit` to check for security vulnerabilities
3. Check git status - ensure clean working directory before starting
4. Analyze the dependency tree with `npm ls` to understand current relationships

## Phase 2: Research & Planning

1. For each outdated package, check GitHub releases page for:
   - Breaking changes in changelogs/migration guides
   - Peer dependency requirements
   - Compatibility with other packages in our stack
2. Prioritize updates: security patches → major versions → minor versions → patch versions
3. Group related packages that should be updated together (e.g., Angular ecosystem, testing libraries, build tools)
4. Ignore non-stable versions (alpha, beta, rc) unless addressing critical security issues
5. Create an update plan showing packages and target versions

## Phase 3: Execution Plan Approval

Present the update plan for confirmation before proceeding, including:

- Which packages will be updated and to which versions
- Expected breaking changes and required code modifications
- Update order/grouping strategy

## Phase 4: Systematic Updates

For each package/group:

1. Update the specific package(s): `npm update [package]` or `npm install [package]@[version]`
2. Run comprehensive checks with `npm run ci`
3. If any checks fail:
   - Analyze the failure and apply necessary code changes
   - Consult package changelog/migration guide
   - Re-run failed checks
   - If unable to resolve, document the issue and consider rollback

## Phase 5: Completion

1. Ensure all automated checks pass
2. Generate a descriptive commit message (user will commit manually)
3. Provide summary report:
   - List of updated packages with version changes
   - Key improvements/changes from new versions
   - Any breaking changes handled
   - Security vulnerabilities resolved

## Rollback Strategy

If critical issues arise, be prepared to:

1. Revert to previous package-lock.json: `git checkout package-lock.json`
2. Reinstall previous versions: `npm install`
3. Document the problematic package for future investigation
