import os.path
import base64
from email.message import EmailMessage
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/gmail.compose"]

import json

def authenticate_gmail():
    """Shows basic usage of the Gmail API.
    Authenticates and returns credentials.
    """
    creds = None
    
    token_b64 = os.environ.get("GMAIL_TOKEN_B64")
    creds_b64 = os.environ.get("GMAIL_CREDENTIALS_B64")
    
    if token_b64:
        token_data = json.loads(base64.b64decode(token_b64).decode('utf-8'))
        creds = Credentials.from_authorized_user_info(token_data, SCOPES)
    elif os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
        
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception:
                creds = None
        
        if not creds or not creds.valid:
            if creds_b64:
                creds_data = json.loads(base64.b64decode(creds_b64).decode('utf-8'))
                flow = InstalledAppFlow.from_client_config(creds_data, SCOPES)
            elif os.path.exists("credentials.json"):
                flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            else:
                raise FileNotFoundError("credentials.json not found locally and GMAIL_CREDENTIALS_B64 not set.")
                
            # Note: run_local_server requires a local browser, which will fail on a cloud server.
            # Make sure to generate the token locally and upload it to the cloud environment.
            creds = flow.run_local_server(port=0)
            
        # Only save to file if we are running locally (no env vars set)
        if not token_b64:
            with open("token.json", "w") as token:
                token.write(creds.to_json())
            
    return creds

def create_draft(target_email: str, subject: str, body_text: str, attachment_path: str = None, html_body: str = None):
    """Create and insert a draft email.
       Returns: Draft object, including draft id and message meta data.
    """
    try:
        creds = authenticate_gmail()
        service = build("gmail", "v1", credentials=creds)

        message = EmailMessage()
        message.set_content(body_text)
        if html_body:
            message.add_alternative(html_body, subtype='html')
            
        message["To"] = target_email
        message["From"] = "me"
        message["Subject"] = subject
        
        if attachment_path and os.path.exists(attachment_path):
            import mimetypes
            with open(attachment_path, "rb") as f:
                file_data = f.read()
            file_name = os.path.basename(attachment_path)
            
            # Guess the mimetype
            mime_type, _ = mimetypes.guess_type(attachment_path)
            if mime_type is None:
                mime_type = 'application/octet-stream'
            maintype, subtype = mime_type.split('/', 1)
            
            message.add_attachment(file_data, maintype=maintype, subtype=subtype, filename=file_name)

        # encoded message
        encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()

        create_message = {"message": {"raw": encoded_message}}

        draft = (
            service.users()
            .drafts()
            .create(userId="me", body=create_message)
            .execute()
        )
        print(f"Draft created successfully. Draft ID: {draft['id']}")
        return draft

    except HttpError as error:
        print(f"An error occurred: {error}")
        return None
