# Test Scenarios

Work through these scenarios and note anything that doesn't behave as expected. For each issue found, [create a GitHub issue](reporting-issues.md).

---

## Authentication

- [ ] Open the landing page — public stats are visible without logging in
- [ ] Daily Bible verse appears on the landing page
- [ ] Clicking "Login" opens the login form
- [ ] Signing up without an invitation (if open signup is off) shows a clear error
- [ ] Signing in with wrong credentials shows an error
- [ ] After sign-in, redirected to complete-profile page if profile is incomplete
- [ ] Completing profile with missing required fields shows validation errors
- [ ] After completing profile, redirected to dashboard

---

## Dashboard

- [ ] Dashboard loads after login
- [ ] Personal stats (problem count, streak) are visible
- [ ] Recent submissions list appears

---

## Problem library

- [ ] Problems list loads and shows items
- [ ] Filtering by platform (LEETCODE, CODEFORCES) works
- [ ] Filtering by tag works
- [ ] Search returns relevant results
- [ ] Clicking a problem opens the submission detail / editorial page

---

## Submissions

- [ ] Log a manual submission via the web form
- [ ] Submission appears in your profile / dashboard after logging
- [ ] Submission detail page shows the code with syntax highlighting
- [ ] Problem count increments after logging a new unique problem

---

## Editorials

- [ ] Navigating to a problem shows existing editorials
- [ ] Writing a new editorial saves and displays correctly
- [ ] Markdown rendering (bold, code blocks, headers) works
- [ ] Upvoting and downvoting changes the score
- [ ] Editing your own editorial reflects the changes
- [ ] Deleting your own editorial removes it from the list

---

## Contests

- [ ] Contest list loads
- [ ] Clicking a contest shows the standings table
- [ ] Standings show rank, rating delta, and problems solved

---

## Announcements

- [ ] Announcements page shows announcements
- [ ] Squad announcements only show for members of that squad
- [ ] Global announcements show for everyone

---

## Extension (if installed)

- [ ] Extension popup opens and accepts API key
- [ ] Submitting a correct solution on LeetCode triggers a notification
- [ ] Submitting a correct solution on Codeforces triggers a notification
- [ ] The submission appears in the hub after the notification
- [ ] Submitting a wrong answer does **not** log a submission

---

## Settings

- [ ] Settings page loads
- [ ] "Generate API Key" shows the key once and hides it after dismissal
- [ ] "Revoke API Key" removes the key (subsequent extension requests should fail)

---

## Admin panel (admin accounts only)

- [ ] Admin page lists all users
- [ ] Changing a user's role takes effect immediately
- [ ] Assigning a user to a squad reflects in their profile
- [ ] Banning a user prevents their login
- [ ] Creating an invitation generates a working link
- [ ] Posting a global announcement appears for all users

---

## Edge cases & error states

- [ ] Accessing a non-existent URL shows a 404 or redirect
- [ ] Accessing an admin page as a non-admin shows an error or redirects
- [ ] Long markdown content in an editorial renders without layout breaking
- [ ] Very long problem names don't overflow the problem card
- [ ] The app works on a mobile screen width (responsive layout)
