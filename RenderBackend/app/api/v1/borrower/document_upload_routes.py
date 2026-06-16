"""
Borrower Document Upload Routes

Public endpoints for borrowers to upload documents via secure upload links.
No authentication required - token-based access only.
"""

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.communication import DocumentUploadResponse
from app.services.document_ai_verification_service import run_document_verification_task
from app.services.document_service import DocumentService
from app.services.token_service import TokenService

router = APIRouter(
    prefix="/borrower",
    tags=["borrower-document-upload"],
)


@router.get("/upload/{upload_token}", response_class=HTMLResponse)
def get_upload_page(upload_token: str, db: Session = Depends(get_db)):
    """
    GET endpoint to display document upload form.
    
    Validates the upload token and returns an HTML form for document upload.
    No authentication required - token serves as authorization.
    
    Args:
        upload_token: Secure upload token from email/SMS link
        db: Database session
        
    Returns:
        HTML: Upload form page
        
    Raises:
        400: Invalid token
        410: Token expired
    """
    # Validate token
    is_valid, error, application_id = TokenService.validate_token(upload_token, db)
    
    if not is_valid:
        # Determine status code based on error message
        if "expired" in error.lower():
            status_code = status.HTTP_410_GONE
        else:
            status_code = status.HTTP_400_BAD_REQUEST
        
        # Return error page
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Upload Link Error</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 50px auto;
                    padding: 20px;
                    text-align: center;
                }}
                .error-box {{
                    background-color: #fff3cd;
                    border: 1px solid #ffc107;
                    border-radius: 8px;
                    padding: 24px;
                    margin: 20px 0;
                }}
                .error-icon {{
                    font-size: 48px;
                    color: #ff9800;
                }}
                h1 {{
                    color: #856404;
                }}
                p {{
                    color: #666;
                    line-height: 1.6;
                }}
            </style>
        </head>
        <body>
            <div class="error-icon">⚠️</div>
            <div class="error-box">
                <h1>Upload Link Error</h1>
                <p>{error}</p>
            </div>
        </body>
        </html>
        """
    
    # Get ARN for display
    from app.models.loan_application import LoanApplication
    application = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    arn = application.arn if application else "Unknown"
    
    # Get allowed document types
    doc_types = DocumentService.ALLOWED_DOCUMENT_TYPES
    doc_type_options = "".join([f'<option value="{dt}">{dt}</option>' for dt in doc_types])
    
    # Return upload form HTML
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Upload Documents - CreditShield</title>
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}
            body {{
                font-family: Arial, sans-serif;
                background-color: #f5f5f5;
                padding: 20px;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                overflow: hidden;
            }}
            .header {{
                background-color: #00c853;
                color: white;
                padding: 24px;
                text-align: center;
            }}
            .header h1 {{
                font-size: 24px;
                margin-bottom: 8px;
            }}
            .header p {{
                font-size: 14px;
                opacity: 0.9;
            }}
            .content {{
                padding: 32px 24px;
            }}
            .form-group {{
                margin-bottom: 24px;
            }}
            label {{
                display: block;
                margin-bottom: 8px;
                font-weight: bold;
                color: #333;
            }}
            select, input[type="file"] {{
                width: 100%;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
            }}
            select:focus, input[type="file"]:focus {{
                outline: none;
                border-color: #00c853;
            }}
            .file-info {{
                margin-top: 8px;
                font-size: 12px;
                color: #666;
            }}
            .upload-btn {{
                width: 100%;
                padding: 14px;
                background-color: #00c853;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                transition: background-color 0.3s;
            }}
            .upload-btn:hover {{
                background-color: #00a844;
            }}
            .upload-btn:disabled {{
                background-color: #ccc;
                cursor: not-allowed;
            }}
            .info-box {{
                background-color: #e3f2fd;
                border-left: 4px solid #2196f3;
                padding: 16px;
                margin-bottom: 24px;
                border-radius: 4px;
            }}
            .info-box p {{
                color: #1565c0;
                font-size: 14px;
                line-height: 1.6;
            }}
            .success-message {{
                background-color: #d4edda;
                border: 1px solid #c3e6cb;
                color: #155724;
                padding: 16px;
                border-radius: 4px;
                margin-bottom: 16px;
                display: none;
            }}
            .error-message {{
                background-color: #f8d7da;
                border: 1px solid #f5c6cb;
                color: #721c24;
                padding: 16px;
                border-radius: 4px;
                margin-bottom: 16px;
                display: none;
            }}
            .loading {{
                display: none;
                text-align: center;
                padding: 20px;
            }}
            .spinner {{
                border: 4px solid #f3f3f3;
                border-top: 4px solid #00c853;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto;
            }}
            @keyframes spin {{
                0% {{ transform: rotate(0deg); }}
                100% {{ transform: rotate(360deg); }}
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📄 Upload Documents</h1>
                <p>Application Reference: {arn}</p>
            </div>
            
            <div class="content">
                <div id="successMessage" class="success-message"></div>
                <div id="errorMessage" class="error-message"></div>
                
                <div class="info-box">
                    <p><strong>📋 Instructions:</strong> Select the document type and choose a file to upload. You can upload multiple documents using this link.</p>
                </div>
                
                <form id="uploadForm" enctype="multipart/form-data">
                    <div class="form-group">
                        <label for="docType">Document Type *</label>
                        <select id="docType" name="doc_type" required>
                            <option value="">-- Select Document Type --</option>
                            {doc_type_options}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="file">Choose File *</label>
                        <input type="file" id="file" name="file" accept=".pdf,.jpg,.jpeg,.png" required>
                        <div class="file-info">
                            Allowed formats: PDF, JPG, PNG | Maximum size: 10MB
                        </div>
                    </div>
                    
                    <button type="submit" class="upload-btn" id="uploadBtn">
                        Upload Document
                    </button>
                </form>
                
                <div id="loading" class="loading">
                    <div class="spinner"></div>
                    <p style="margin-top: 16px; color: #666;">Uploading document...</p>
                </div>
            </div>
        </div>
        
        <script>
            const form = document.getElementById('uploadForm');
            const uploadBtn = document.getElementById('uploadBtn');
            const loading = document.getElementById('loading');
            const successMessage = document.getElementById('successMessage');
            const errorMessage = document.getElementById('errorMessage');
            const fileInput = document.getElementById('file');
            
            // File size validation
            fileInput.addEventListener('change', function() {{
                const file = this.files[0];
                if (file && file.size > 10 * 1024 * 1024) {{
                    errorMessage.textContent = 'File size exceeds 10MB limit. Please choose a smaller file.';
                    errorMessage.style.display = 'block';
                    this.value = '';
                }} else {{
                    errorMessage.style.display = 'none';
                }}
            }});
            
            form.addEventListener('submit', async function(e) {{
                e.preventDefault();
                
                // Hide messages
                successMessage.style.display = 'none';
                errorMessage.style.display = 'none';
                
                // Show loading
                form.style.display = 'none';
                loading.style.display = 'block';
                uploadBtn.disabled = true;
                
                // Prepare form data
                const formData = new FormData(form);
                
                try {{
                    const response = await fetch('/borrower/upload/{upload_token}', {{
                        method: 'POST',
                        body: formData
                    }});
                    
                    const data = await response.json();
                    
                    // Hide loading
                    loading.style.display = 'none';
                    form.style.display = 'block';
                    uploadBtn.disabled = false;
                    
                    if (response.ok && data.success) {{
                        // Show success message
                        successMessage.innerHTML = `
                            <strong>✅ Success!</strong><br>
                            Document "${{data.document.filename}}" uploaded successfully.<br>
                            <small>You can upload more documents using this link.</small>
                        `;
                        successMessage.style.display = 'block';
                        
                        // Reset form
                        form.reset();
                        
                        // Scroll to top
                        window.scrollTo({{ top: 0, behavior: 'smooth' }});
                    }} else {{
                        // Show error message
                        errorMessage.innerHTML = `<strong>❌ Error:</strong> ${{data.message || 'Upload failed. Please try again.'}}`;
                        errorMessage.style.display = 'block';
                    }}
                }} catch (error) {{
                    // Hide loading
                    loading.style.display = 'none';
                    form.style.display = 'block';
                    uploadBtn.disabled = false;
                    
                    // Show error message
                    errorMessage.innerHTML = '<strong>❌ Error:</strong> Network error. Please check your connection and try again.';
                    errorMessage.style.display = 'block';
                }}
            }});
        </script>
    </body>
    </html>
    """


@router.post("/upload/{upload_token}", response_model=DocumentUploadResponse)
async def upload_document(
    upload_token: str,
    background_tasks: BackgroundTasks,
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    POST endpoint to handle document upload.
    
    Validates token, uploads file to S3, and creates document record.
    Allows multiple uploads with the same token (multi-use within 72 hours).
    
    Args:
        upload_token: Secure upload token from email/SMS link
        doc_type: Document type (from form)
        file: Uploaded file
        db: Database session
        
    Returns:
        DocumentUploadResponse: Upload result with document details
        
    Raises:
        400: Invalid token or file
        410: Token expired
        413: File too large
    """
    # Validate token
    is_valid, error, application_id = TokenService.validate_token(upload_token, db)
    
    if not is_valid:
        # Determine status code based on error message
        if "expired" in error.lower():
            raise HTTPException(status_code=status.HTTP_410_GONE, detail=error)
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    
    # Get ARN for S3 folder structure
    from app.models.loan_application import LoanApplication
    application = db.query(LoanApplication).filter(LoanApplication.id == application_id).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan application not found"
        )
    
    arn = application.arn
    
    # Upload document
    success, error_msg, document_data = await DocumentService.upload_document(
        file=file,
        application_id=application_id,
        arn=arn,
        doc_type=doc_type,
        db=db
    )
    
    if not success:
        # Determine status code based on error
        if "exceeds" in error_msg.lower() and "limit" in error_msg.lower():
            raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=error_msg)
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)

    # Trigger AI verification asynchronously so status moves out of Pending OCR.
    document_id = int(document_data["id"])
    background_tasks.add_task(run_document_verification_task, document_id)
    
    # Create audit log for document upload
    from app.services.workflow_service import workflow_service
    workflow_service.add_audit_log(
        user="Borrower",
        action="Document Uploaded",
        resource=arn,
        details=f"Document type: {doc_type}, Filename: {file.filename}",
        risk="Low"
    )
    
    return DocumentUploadResponse(
        success=True,
        message="Document uploaded successfully",
        document=document_data
    )
