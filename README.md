# Geo-catedra

  A free geography website for Romanian high school students and their teachers.
  Live at **[geocatedra.com](https://geocatedra.com)**.

  No account, no login and no ads. You open the site and start learning.

  ---

  ## Why it exists

  My mother teaches geography. Over the years she built up a huge collection of
  lessons, photo galleries, worksheets, lesson plans and tests. Most of it lived in
  PowerPoint files on her laptop. Geocatedra puts that work online so any student or
  teacher in Romania can use it for free.

  It starts with grade 9 and follows the national curriculum chapter by chapter.

  ## What's on it

  **For students**
  - Lessons, photo galleries, diagrams and documents, sorted by grade and chapter.
  - **Exersează**, a practice mode. It builds a random multiple-choice test from a
    bank of over 300 questions, gives you hints if you're stuck, and shows you what
    you got wrong.
  - Interactive games: matching pairs, putting things in order, placing photos on a
    map, and naming places on a map.
  - A mind map for each topic, so a whole chapter fits on one screen.

  **For teachers**
  - A free library of teaching material: lesson plans, a methodology guide, full
    lesson projects, case studies on Dobrogea and model tests. You flip through each
    one page by page in the browser.

  Everything on the site is in Romanian and written in plain language. Every photo
  is public domain or CC0, and its source is recorded.

  ## How it's built

  | Layer | Choice |
  |---|---|
  | Framework | React Router v7, running on Cloudflare Workers |
  | Database | Cloudflare D1 (SQLite) with Drizzle ORM |
  | Images and files | Cloudflare R2 |
  | Language | TypeScript |
  | Tests | Vitest |

  It costs nothing to run. Every piece fits inside Cloudflare's free tier, and that
  was a goal from day one rather than luck.

  ## A few rules the code follows

  - **Nothing about you is stored.** There are no accounts and no cookies. The
    practice tests save nothing. Visitor counts come from Cloudflare's cookieless
    analytics, and the privacy page updates itself depending on whether they're on.
  - **The answers stay on the server.** A practice test sends you the questions but
    not the answers. Your test is graded on the server, so viewing the page source
    won't help you cheat.
  - **No guessing by length.** Students quickly learn that the longest option is
    usually the right one. A script and a test check every question so the correct
    answer is the longest about as often as chance would make it.
  - **Only published material gets out.** Every page and image passes a check on the
    server first, so drafts stay hidden no matter what URL someone tries. The public
    build has no admin routes in it at all.
  - **Geography is just the content.** The engine doesn't know which subject it's
    teaching. That lives in one config file plus the content, so the same code could
    host history or biology.
  - **Fast on a phone.** Most visitors are students on mobile data. List pages send
    only what they show, images get small thumbnails, and fonts load early.

  ## What's in the repo

      app/       the website: pages, game engines, database schema, scripts
      content/   the geography: galleries, games, interactive material, teaching material
      docs/      architecture notes and the reasoning behind the big decisions

  The major decisions are written up as short ADRs in `docs/adr/`, with a running
  log in `docs/DECISIONS.md`.


  ---

  **Matei Necula** · Bucharest, Romania
  [LinkedIn](https://linkedin.com/in/matei-necula) · [GitHub](https://github.com/matei-necula)
