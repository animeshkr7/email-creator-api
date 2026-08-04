# Email Creator API & UI

This repository houses the backend API and frontend User Interface for the LinkedIn Email Draft automation pipeline.

## Structure
- `main.py`: A FastAPI backend that connects to Supabase and handles email drafting via LLM.
- `email-application-ui/`: The frontend UI (HTML/JS/CSS) that interacts with the backend.

## Features
- **Job URL Storage**: Store and delete job URLs in Supabase.
- **Email Drafting**: Automatically extract details from a job post and draft a highly-personalized email directly in your Gmail account.
- **Scraped Posts UI**: Filter your scraped LinkedIn jobs by Date and Time Slot (`Morning`, `Noon`, `Evening`, `Night`) and instantly trigger an email draft with one click.

## API Endpoints
- `POST /store_record`: Store a job record.
- `GET /fetch_records`: Fetch all stored job records.
- `GET /fetch_scraped_posts`: Fetch all automatically scraped LinkedIn posts for a given date. (Includes time slot data).
- `POST /draft_email`: Triggers the LLM email generation and sends the draft to Gmail.
- `DELETE /delete_record/{record_id}`: Delete a job record.

## Hosting
- The **API** is hosted on Render and deploys automatically on push.
- The **UI** is hosted via GitHub Pages and is embedded via an iframe on the public portfolio site for seamless access.
