const { promisePool } = require("../config/db");

// =====================================================================
// COHORT SEGREGATION
// =====================================================================
// A "cohort" is (academic_year + track). Students only see content from
// their own cohort (plus untagged/global content). Doctors, admins and
// investors are NOT students, so they bypass the restriction.
//
// Track only applies to years 3 & 4; years 1 & 2 have track = null.
// =====================================================================

// Resolve the viewer's cohort. Returns { year, track } for a student, or
// null for anyone else (→ no restriction).
async function getUserCohort(user) {
  if (!user || user.role !== "student") return null;
  try {
    const [[row]] = await promisePool.query(
      "SELECT academic_year, track FROM Profile_Studies WHERE user_id = ? LIMIT 1",
      [user.id]
    );
    if (!row || row.academic_year == null) return null;
    return { year: String(row.academic_year), track: row.track || null };
  } catch {
    return null;
  }
}

// Build a WHERE fragment limiting `alias`-tagged content to the viewer's
// cohort, plus untagged/global (NULL) rows. Returns null when there's no
// restriction (viewer is not a student).
//
//   const filter = buildCohortFilter("Posts", cohort);
//   const where  = filter ? `WHERE ${filter.clause}` : "";
//   const params = filter ? filter.params : [];
function buildCohortFilter(alias, cohort) {
  if (!cohort) return null;
  const y = `${alias}.academic_year`;
  const t = `${alias}.track`;
  if (cohort.track) {
    // Global, OR whole-year (track NULL = both tracks), OR this exact track.
    return { clause: `(${y} IS NULL OR (${y} = ? AND (${t} IS NULL OR ${t} = ?)))`, params: [cohort.year, cohort.track] };
  }
  return { clause: `(${y} IS NULL OR ${y} = ?)`, params: [cohort.year] };
}

// Whether a single content row (with academic_year/track fields) is visible
// to the viewer — used to guard by-id endpoints (direct access).
function canViewCohort(cohort, row) {
  if (!cohort) return true;                    // non-student → full access
  if (row.academic_year == null) return true;  // global content
  if (String(row.academic_year) !== cohort.year) return false;
  if (cohort.track && row.track && row.track !== cohort.track) return false;
  return true;
}

// Normalize a (year, track) pair coming from a request body — clears track
// for years that don't have one. Returns { year, track }.
function normalizeCohortInput(year, track) {
  const y = year != null && year !== "" ? String(year) : null;
  let t = track || null;
  if (!y || !["3", "4"].includes(y)) t = null; // track only for years 3 & 4
  return { year: y, track: t };
}

module.exports = { getUserCohort, buildCohortFilter, canViewCohort, normalizeCohortInput };
