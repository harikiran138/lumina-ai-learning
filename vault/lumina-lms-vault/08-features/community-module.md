# Community Module

> **File:** `08-features/community-module.md`
> **Related:** [[08-features/01-course-management]], [[02-roles/05-learner]]
> **Last Updated:** 2026-04-15

The Community module provides a course-scoped discussion board available to every enrolled student and the course Teacher. Full detail on post types, moderation, and anonymous posting is documented in [[08-features/01-course-management]] under the **Community Board** section.

## Quick Reference

| Feature | Detail |
|---|---|
| Scope | Per-course — students only see boards for enrolled courses |
| Post types | Question, Discussion, Resource |
| Anonymous posting | Supported — identity hidden from peers, visible to Teacher/Faculty |
| Moderation | Teacher can pin, hide, or delete any post |
| Peer Tutor | Can pin their own posts in the peer channel |
| Backend table | `community_posts`, `community_replies`, `community_upvotes` |
| API prefix | `GET/POST /api/community?course_id=` |
