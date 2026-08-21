---
name: case-study-log
description: Update and improve the case study when encountering and resolving new bugs or when a real tradeoff happens, by drafting an entry in the case study section that continues the established voice. Use when a bug just got diagnosed and fixed, or a real tradeoff or structural decision gets made, or the user asks to update, log, or document something in the case study.
model: sonnet
---
# Instructions
# Step 1: Understanding the Voice
Read the src/app/case-study/page.tsx to understand the current voice and extract the voice/language there.

# Step 2: The Title and Reason of the New Entry
Create a new entry in the case-study section following the previous voice of the page (the language, verb choices, tone) explaining the reason behind the new section (a bug encountered, a tradeoff made etc. )

# Step 3: Writing the Content of the New Entry 
If there was a bug, explain how it was resolved, the decision behind any tradeoffs made, its impact on the site, any data analysis relevant, any metrics that need to be added to this section.

# Step 4: Refer to successful case studies and Revise the entry before writing
Read `.claude/skills/case-study-log/references/case-study-structure.md`
for the standard a case-study entry needs to clear before you draft an entry.