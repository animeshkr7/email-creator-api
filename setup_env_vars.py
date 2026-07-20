import os
import base64

def append_to_env():
    env_path = ".env"
    
    # Read existing .env to check if keys already exist
    existing_content = ""
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            existing_content = f.read()

    with open(env_path, "a", encoding="utf-8") as env_file:
        # Process credentials.json
        if os.path.exists("credentials.json"):
            if "GMAIL_CREDENTIALS_B64=" not in existing_content:
                with open("credentials.json", "rb") as f:
                    creds_data = f.read()
                b64_creds = base64.b64encode(creds_data).decode('utf-8')
                env_file.write(f"\nGMAIL_CREDENTIALS_B64={b64_creds}\n")
                print("Added GMAIL_CREDENTIALS_B64 to .env")
            else:
                print("GMAIL_CREDENTIALS_B64 already in .env")
        else:
            print("credentials.json not found.")

        # Process token.json
        if os.path.exists("token.json"):
            if "GMAIL_TOKEN_B64=" not in existing_content:
                with open("token.json", "rb") as f:
                    token_data = f.read()
                b64_token = base64.b64encode(token_data).decode('utf-8')
                env_file.write(f"GMAIL_TOKEN_B64={b64_token}\n")
                print("Added GMAIL_TOKEN_B64 to .env")
            else:
                print("GMAIL_TOKEN_B64 already in .env")
        else:
            print("token.json not found.")

if __name__ == "__main__":
    append_to_env()
