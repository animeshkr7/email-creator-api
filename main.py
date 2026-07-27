import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables from .env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in .env file")

# Initialize Supabase Client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="Job Data API")

# Enable CORS so the UI can communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (good for testing local HTML files)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the Pydantic model for incoming JSON data
class JobRecord(BaseModel):
    email: str
    type: str
    date: str  # Expected format: DD-MM-YY

    @field_validator('date')
    @classmethod
    def validate_date_format(cls, v: str) -> str:
        try:
            # Validate that it matches DD-MM-YY
            datetime.strptime(v, "%d-%m-%y")
            return v
        except ValueError:
            raise ValueError("Date must be in DD-MM-YY format")


class CareerLinkRequest(BaseModel):
    url: str
    date: str | None = None  # Format: DD-MM-YY (defaults to current date if omitted)
    status: str | None = "Pending"


@app.post("/store_record")
async def store_record(record: JobRecord):
    """
    API 1: Takes JSON data (email, type, date in DD-MM-YY format) and stores it in Supabase.
    """
    try:
        response = supabase.table('job_records').insert({
            "email": record.email,
            "type": record.type,
            "date": record.date
        }).execute()
        
        inserted_data = response.data
        return {"message": "Record stored successfully", "data": inserted_data[0] if inserted_data else {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/link")
async def save_career_link(record: CareerLinkRequest):
    """
    API 1b: Takes a career page job link and stores it with current date in Supabase (job_url table).
    """
    try:
        save_date = record.date.strip() if record.date and record.date.strip() else datetime.now().strftime("%d-%m-%y")
        datetime.strptime(save_date, "%d-%m-%y")
        status = record.status if record.status else "Pending"

        response = supabase.table('job_url').insert({
            "url": record.url,
            "date": save_date,
            "status": status
        }).execute()

        inserted_data = response.data
        return {
            "message": "Career page job link saved successfully",
            "saved_date": save_date,
            "data": inserted_data[0] if inserted_data else {}
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Must be DD-MM-YY")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/fetch_by_date")
async def fetch_by_date(date: str, table: str = "job_records"):
    """
    API 2: Takes a date argument (DD-MM-YY) and fetches all matching records from specified table.
    Example: /fetch_by_date?date=15-07-26&table=job_url
    """
    try:
        # Validate the date format first
        datetime.strptime(date, "%d-%m-%y")
        target_table = "job_url" if table.lower() == "job_url" else "job_records"
        
        # Query Supabase for matching records
        response = supabase.table(target_table).select("*").eq("date", date).execute()
        
        records = response.data
        if not records:
            return {"message": "No records found for this date", "data": []}
            
        return {"message": f"Found {len(records)} records", "data": records}
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Must be DD-MM-YY")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/delete_record/{record_id}")
async def delete_record(record_id: int, table: str = "job_url"):
    """
    API 2b: Delete a record by ID from specified table.
    """
    try:
        target_table = "job_records" if table.lower() == "job_records" else "job_url"
        response = supabase.table(target_table).delete().eq("id", record_id).execute()
        return {"message": "Record deleted successfully", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class DraftRequest(BaseModel):
    email: str

@app.post("/draft_email")
async def draft_email(req: DraftRequest):
    """
    API 3: Takes an email address, generates an email body via LLM, 
    and creates a draft in Gmail with the resume attached.
    """
    try:
        from llm_generator import generate_email_body
        from email_drafting import create_draft
        import os
        
        # 1. Generate body
        body_plain, body_html, company_name = generate_email_body(req.email)
        
        # 2. Setup subject and resume
        subject = f"Application for ML Engineer - Animesh Singh"
        # Find absolute path to resume in case we are running from a different dir
        base_dir = os.path.dirname(os.path.abspath(__file__))
        resume_path = os.path.join(base_dir, "Animesh_Resume.pdf")
        
        # 3. Create Draft
        draft = create_draft(req.email, subject, body_plain, attachment_path=resume_path, html_body=body_html)
        
        if draft:
            return {"message": f"Draft created successfully for {req.email}", "draft_id": draft["id"], "company": company_name}
        else:
            raise HTTPException(status_code=500, detail="Failed to create Gmail draft")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

