
# Polar Copilot - Clearport KE

Clearport KE - Upload BL, Invoice, Packing List, verify with Digicust AI, download Filing Pack for KRA iCMS.

## What it is

Our platform is built as a simple Next.js web application hosted on Vercel with Supabase as the database, file storage, and authentication layer, and Digicust as the AI processing layer.

An agent uploads their Bill of Lading, Commercial Invoice, and Packing List through a public upload page and receives a unique reference number like FILE-101.

Files are stored in a private Supabase Storage bucket and a record is created in the files table with status UPLOADED.

The backend then sends the file URLs to the Digicust API which performs OCR, extraction, and HS Code classification up to 11 digits with confidence scores and GR1-GR6 reasoning and returns the result via a secure webhook.

The platform saves the extracted fields with their confidence scores and changes the status to NEEDS_REVIEW.

An operator then opens the private admin dashboard, verifies the data on a split-screen view with the original PDF on the left and an editable form on the right where low-confidence fields below 80 percent and failed validation checks are highlighted with a red border.

Once all required fields are verified the operator approves the file which triggers the Filing Pack Generator to create a clean PDF summary and Excel checklist and changes the status to READY.

The agent then returns to the public download page, enters their reference number and email to receive a secure one-hour signed download link for the Filing Pack, and finally files the declaration manually in KRA iCMS using their own KRA-licensed clearing agent.

All files auto-delete after 30 days. No WhatsApp, no Redis, no automatic KRA filing, no multi-tenant system in Version 1.

## Stack
- Next.js on Vercel
- Supabase (Database + Storage + Auth)
- Digicust AI
