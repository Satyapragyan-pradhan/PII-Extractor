import cv2
import re
import os
import magic
import fitz  
import spacy
import pandas as pd
import pytesseract
from docx import Document
from typing import List, Dict
import json
from datetime import datetime
import traceback
from rapidfuzz import fuzz
from collections import defaultdict

tess_path = os.getenv("TESSERACT_PATH")
if tess_path:
    pytesseract.pytesseract.tesseract_cmd = tess_path

try:
    nlp = spacy.load("en_core_web_sm")
except:
    os.system("python -m spacy download en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")


class DocType:
    IMAGE = "image"
    PDF = "pdf"
    DOCX = "docx"
    EXCEL = "excel"
    UNSUPPORTED = "unsupported"

def identify_file(file_path: str) -> str:
    #Extension Based
    ext = os.path.splitext(file_path)[1].lower()
    if ext in ['.png', '.jpg', '.jpeg']: return DocType.IMAGE
    if ext == '.pdf': return DocType.PDF
    if ext == '.docx': return DocType.DOCX
    if ext in ['.xlsx', '.xls']: return DocType.EXCEL

    
    try:
        mime = magic.Magic(mime=True)
        mtype = mime.from_file(file_path)
        if "image" in mtype: return DocType.IMAGE
        if "pdf" in mtype: return DocType.PDF
        if "officedocument.wordprocessingml" in mtype: return DocType.DOCX
        if "officedocument.spreadsheetml" in mtype: return DocType.EXCEL
    except: 
        return DocType.UNSUPPORTED


def production_preprocess(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    denoised = cv2.bilateralFilter(gray, 7, 50, 50)
    #for varying lighting
    thresh = cv2.adaptiveThreshold(denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 4)
    return thresh



ADDRESS_KEYWORDS = [
    "address", "addr", "r/o", "s/o", "d/o","resident","residence","location",
    "flat", "floor", "building", "block", "sector", "lane", "road",
    "rd", "street", "st", "area", "locality", "village", "po", "ps",
    "dist", "near", "opp", "thikana",
]

INDIAN_STATES = [
    "andhra pradesh", "arunachal pradesh", "assam", "bihar",
    "chhattisgarh", "delhi", "goa", "gujarat", "haryana",
    "himachal pradesh", "jharkhand", "karnataka", "kerala",
    "madhya pradesh", "maharashtra", "manipur", "meghalaya",
    "mizoram", "nagaland", "odisha", "punjab", "rajasthan",
    "sikkim", "tamil nadu", "telangana", "tripura",
    "uttar pradesh", "uttarakhand", "west bengal"
]

PIN_REGEX = re.compile(r"\b\d{6}\b")


def extract_address_indian(text: str) -> str:
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    address_parts = []
    capturing = False

    for i, line in enumerate(lines):
        upper_line = line.upper()

        if not capturing:
            if any(re.search(rf"\b{kw}\b", line, re.IGNORECASE) for kw in ADDRESS_KEYWORDS):
                capturing = True
                clean = re.sub(r"(?i)(address|location|thikana)\s*[:,-]*", "", line).strip()
                if clean: address_parts.append(clean)
                continue

        if capturing:
            if any(re.search(rf"\b{term}\b", upper_line) for term in ["PAN", "AADHAAR", "DOB"]):
                break

            address_parts.append(line)

            if PIN_REGEX.search(line):
                break

            if any(s.upper() in upper_line for s in INDIAN_STATES):
                if i+1 < len(lines) and not PIN_REGEX.search(lines[i+1]):
                    break

    res = " ".join(address_parts).strip()
    return re.sub(r'\s+', ' ', res) if res else ""


def extract_name_from_ocr_lines(lines):
    probable_names = []

    blacklist = {
        "government", "india", "uidai", "income", "tax",
        "department", "address", "male", "female",
        "year", "birth", "dob"
    }

    for line in lines:
        clean = line.strip()
        if not (3 <= len(clean) <= 40):
            continue

        # Reject lines with digits
        if any(c.isdigit() for c in clean):
            continue

        words = clean.split()
        if not (1 <= len(words) <= 3):
            continue

        # Reject all-caps noise
        if clean.isupper() and len(words) == 1:
            continue

        if any(b in clean.lower() for b in blacklist):
            continue

        # Title-case heuristic
        if clean == clean.title():
            probable_names.append(clean)

    return probable_names


# TEXT CLEANUP 

SEPARATOR_LINE_REGEX = r"[-_]{5,}|\.{5,}"

def clean_extracted_address(addr: str) -> str:
    if not addr:
        return addr

    # Remove dash separators
    addr = re.sub(SEPARATOR_LINE_REGEX, "", addr)

    addr = addr.strip(" .,-:")

    addr = re.sub(r"\s{2,}", " ", addr)

    return addr.strip()


def clean_text_global(text: str) -> str:
    # Remove  separators 
    text = re.sub(SEPARATOR_LINE_REGEX, "\n", text)

    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


APPLICANT_BLOCK_REGEX = r"(APPLICANT\s*\d+[:\-]?)"




def count_name_occurrence(name: str, text: str) -> int:
    if not name:
        return 0
    return len(re.findall(rf"\b{re.escape(name)}\b", text, flags=re.IGNORECASE))


DOB_NARRATIVE_REGEX = re.compile(
    r"\b(born on|date of birth|dob)\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})",
    re.IGNORECASE
)

# NARRATIVE ADDRESS REGEX
NARRATIVE_ADDRESS_REGEX = re.compile(
    r"(residing at|resident of|living at)\s+(.+?)(?:\.|\n)",
    re.IGNORECASE
)


ADDRESS_LABEL_REGEX = re.compile(
    r"\baddress\b\s*[:\-]?\s*(.+)",
    re.IGNORECASE
)

def extract_address_strict(text: str) -> str:
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    for i, line in enumerate(lines):
        m = ADDRESS_LABEL_REGEX.search(line)
        if m:
            addr_parts = []

            first = m.group(1).strip()
            if first:
                addr_parts.append(first)

            # collect next lines until stop condition
            j = i + 1
            while j < len(lines):
                stop = re.search(
                    r"\b(pan|aadhaar|dob|gender|mobile|email|name|signature|date)\b",
                    lines[j],
                    re.IGNORECASE,
                )
                if stop:
                    break

                if len(lines[j]) < 4:
                    break

                addr_parts.append(lines[j])
                j += 1

            addr = clean_extracted_address(" ".join(addr_parts))
            if len(addr) > 15:
                return addr

    return ""
def extract_address_near_name(text: str, name: str) -> str:

    if not name:
        return ""

    idx = text.lower().find(name.lower())
    if idx == -1:
        return ""

    # Look around name (500 chars after, 200 chars before)
    window = text[max(0, idx-200): idx+500]

    match = re.search(
        r"(residing at|resident of|living at)\s+(.+?)(?:\.|\n)", 
        window, 
        re.IGNORECASE
    )

    if match:
        addr = match.group(2).strip()
        addr = clean_extracted_address(addr)
        return addr
    return ""

def like_real_address(addr: str) -> bool:
    if not addr or len(addr) < 15:
        return False

    score = 0
    addr_lc = addr.lower()

    if PIN_REGEX.search(addr):
        score += 2

    if any(s in addr_lc for s in INDIAN_STATES):
        score += 1

    if any(k in addr_lc for k in ["road", "rd", "street", "st", "sector", "block", "flat", "floor", "apartment", "lane"]):
        score += 1

    # Narrative text usually has verbs
    if re.search(r"\b(was|were|is|are|access|affected|revealed|analysis)\b", addr_lc):
        score -= 2

    return score >= 2


def extract_pii_hybrid(text: str) -> Dict:
    raw_text = clean_text_global(text)

    patterns = {
        "pan": r"[A-Z]{5}[0-9]{4}[A-Z]",
        "aadhaar": r"\b\d{4}\s?\d{4}\s?\d{4}\b",
        "voter_id": r"\b[A-Z]{3}[0-9]{7}\b",
        "dl": r"\b[A-Z]{2}[ -]?[0-9]{2}(?:[ -]?[0-9]{4}){2,3}\b",
        "phone": r"(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}",
        "email": r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"

    }

    results = {k: list(set(re.findall(v, raw_text))) for k, v in patterns.items()}
     #PHONE NORMALIZATION 
    if results.get("phone"):
        norm_phones = []
        for p in results["phone"]:
            digits = re.sub(r"\D", "", p)
            if len(digits) == 12 and digits.startswith("91"):
                digits = digits[2:]
            if len(digits) == 10:
                norm_phones.append(digits)
        results["phone"] = list(set(norm_phones))


    DOB_LABELED_REGEX = r"(?:DOB|Date of Birth|Birth)[:\s-]*(\d{2}[/-]\d{2}[/-]\d{2,4})"
    DOB_BARE_REGEX = r"\b\d{2}[/-]\d{2}[/-]\d{4}\b"

    dob_matches = re.findall(DOB_LABELED_REGEX, raw_text, flags=re.IGNORECASE)

    narrative_matches = DOB_NARRATIVE_REGEX.findall(raw_text)

    if narrative_matches:
        results["dob"] = [narrative_matches[0][1]]
    elif dob_matches:
        results["dob"] = [dob_matches[0]]
    else:
        bare_dates = re.findall(DOB_BARE_REGEX, raw_text)
        results["dob"] = bare_dates[:1] if bare_dates else []

    detected_names = []

    addr = extract_address_strict(raw_text)

    # Narrative address 
    if not addr:
       m = NARRATIVE_ADDRESS_REGEX.search(raw_text)
       if m:
         candidate = clean_extracted_address(m.group(2))
         if like_real_address(candidate):
            addr = candidate

    # Heuristic Indian address 
    if not addr:
        candidate = extract_address_indian(raw_text)
        if like_real_address(candidate):
            addr = candidate
        else:
            addr = ""

    results["address"] = [addr] if addr else []

    address_lc = " ".join(results["address"]).lower() if results["address"] else ""
   
    lines = [l.strip().replace('"', '').strip(", ") for l in raw_text.split("\n") if l.strip()]

    # CARD DOCUMENT DETECTION
    def is_card_document(lines):
        short_lines = sum(1 for l in lines if 3 < len(l) < 40)
        id_like = any(re.search(r"\b\d{4}[\s-]?\d{4}\b|\b[A-Z]{2,}\d{4,}\b", l) for l in lines)
        return short_lines >= 4 and id_like

    card_doc = is_card_document(lines)

    # NAME EXTRACTION
   
    name_anchors = ["NAME", "APPLICANT", "NOMINEE", "HOLDER"]
    identity_keywords = ["DOB", "DATE OF BIRTH", "BIRTH", "SEX", "GENDER", "VALID", "ISSUE", "EXPIRY"]

    blacklist = [
        "INDIA", "GOVT", "INCOME", "TAX", "UNIQUE", "AUTHORITY",
        "FATHER", "MOTHER", "MALE", "FEMALE"
    ]
    blacklist.extend([s.upper() for s in INDIAN_STATES])

    #Anchor-based
    for i, line in enumerate(lines):
        upper = line.upper()

        if any(kw in upper for kw in ADDRESS_KEYWORDS):
            continue

        if any(anchor in upper for anchor in name_anchors):
            val = re.split(r"NAME|APPLICANT|NOMINEE|HOLDER", line, flags=re.IGNORECASE)[-1].strip(" :-")
            if len(val) < 3 and i + 1 < len(lines):
                val = lines[i + 1].strip()

            if (
                3 < len(val) < 35
                and not any(c.isdigit() for c in val)
                and val.upper() not in blacklist
                and val.lower() not in address_lc
            ):
                detected_names.append(val.title())

    #Card neighborhood
    if card_doc:
        for i, line in enumerate(lines):
            if any(k in line.upper() for k in identity_keywords):
                window = lines[max(0, i - 3): min(len(lines), i + 2)]
                for w in window:
                    w_clean = w.strip()
                    if (
                        3 < len(w_clean) < 35
                        and not any(c.isdigit() for c in w_clean)
                        and w_clean.upper() not in blacklist
                        and not any(kw in w_clean.upper() for kw in ADDRESS_KEYWORDS)
                    ):
                        detected_names.append(w_clean.title())

    #spaCy
    doc = nlp(raw_text)
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            name = ent.text.strip().title()
            if (
                len(name.split()) >= 2
                and name.upper() not in blacklist
                and name.lower() not in address_lc
            ):
                detected_names.append(name)


    def merge_consecutive(lines):
        merged = []
        skip = False
        for i in range(len(lines) - 1):
            if skip:
                skip = False
                continue
            a, b = lines[i], lines[i + 1]
            if a.isalpha() and b.isalpha():
                merged.append(f"{a} {b}")
                skip = True
            else:
                merged.append(a)
        if not skip and lines:
            merged.append(lines[-1])
        return merged

    detected_names = merge_consecutive(detected_names)

    # OCR FALLBACK

    if not detected_names:
        detected_names.extend(extract_name_from_ocr_lines(lines))

    results["names"] = list(dict.fromkeys(detected_names))[:1]

    return results


def build_flat_pii_rows(pages, file_path):
    rows = []
    filename = os.path.basename(file_path)

    for page in pages:
        page_no = page["page_number"]
        text = page["text"]

        pii = extract_pii_hybrid(text)

        for pii_type, values in pii.items():
            if not values:
                continue

            if isinstance(values, str):
                values = [values]

            for idx, val in enumerate(values, start=1):
                rows.append({
                    "file_name": filename,
                    "page_number": page_no,
                    "pii_type": pii_type,
                    "pii_value": val,
                    "occurrence": idx
                })

    return {
        "status": "success",
        "rows": rows,
        "filename": filename
    }


def multi_user_grouping(text: str) -> List[Dict]:

    blocks = re.split(r"(?i)Applicant\s+\d+", text)

    if len(blocks) == 1:
        blocks = [text]

    user_list = []
    for block in blocks:
        if len(block.strip()) > 30:
           entities = extract_pii_hybrid(block)

        # Only accept if strong ID exists
           has_strong_id = bool(
            entities.get("aadhaar") 
            or entities.get("pan")
            or entities.get("dl")
            or entities.get("voter_id")
        )

           if not has_strong_id:
             continue
           
        if entities.get("names"):
            addr = extract_address_near_name(block, entities["names"][0])
            if addr:
                entities["address"] = [addr]
        else:
         # if no narrative address near name, drop address from audit text
             entities["address"] = []

        user_list.append(entities)


    return user_list


def process_document(file_path: str):
  
    dtype = identify_file(file_path)
    filename = os.path.basename(file_path)

    try:
        pages = []

        if dtype == DocType.DOCX:
            doc = Document(file_path)
            text = "\n".join(p.text for p in doc.paragraphs)
            pages.append((1, text))

        elif dtype == DocType.PDF:
            with fitz.open(file_path) as doc:
                for i, page in enumerate(doc, start=1):
                    text = page.get_text().strip()
                    if not text:
                        pix = page.get_pixmap(matrix=fitz.Matrix(300 / 72, 300 / 72))
                        import numpy as np
                        img = cv2.imdecode(
                            np.frombuffer(pix.tobytes(), np.uint8),
                            cv2.IMREAD_COLOR
                        )
                        text = pytesseract.image_to_string(
                            production_preprocess(img),
                            config="--psm 3"
                        )
                    pages.append((i, text))


        elif dtype == DocType.IMAGE:
            img = cv2.imread(file_path)
            text = pytesseract.image_to_string(
                production_preprocess(img),
                config="--psm 3"
            )
            pages.append((1, text))


        elif dtype == DocType.EXCEL:
            df = pd.read_excel(file_path)
            pages = [(i + 1, row.to_string()) for i, row in df.iterrows()]

        else:
            return {"status": "error", "message": "Unsupported file format"}

        rows = []

        for page_no, text in pages:
            user_blocks = multi_user_grouping(text)

            # Fallback: single-user document
            if not user_blocks:
              user_blocks = [extract_pii_hybrid(text)]


            for user_idx, pii in enumerate(user_blocks, start=1):
                name=pii.get("names", [""])[0] if pii.get("names") else ""
                occ = count_name_occurrence(name, text)
                row = {
                    "file_name": filename,
                    "user_name": name,
                    "page_number": page_no,
                    "occurrence": occ if occ >0 else 1,
                    "phone": ", ".join(pii.get("phone", [])),
                    "email": ", ".join(pii.get("email", [])),
                    "aadhaar": ", ".join(pii.get("aadhaar", [])),
                    "pan": ", ".join(pii.get("pan", [])),
                    "address": ", ".join(pii.get("address", [])),
                    "dl": ", ".join(pii.get("dl", [])),
                    "voter_id": ", ".join(pii.get("voter_id", [])),
                    "dob": ", ".join(pii.get("dob", [])),
                }

                if any(
                    row[k]
                    for k in row
                    if k not in ("file_name", "page_number", "occurrence")
                ):
                    rows.append(row)

        return {
            "status": "success",
            "rows": rows
        }

    except Exception as e:
        traceback.print_exc()
        return {"status": "failure", "error": str(e)}



def run_pii_extraction(input_data):

    files_to_process = []
    # Normalize input
   
    if isinstance(input_data, str):
        if os.path.isdir(input_data):
            for f in os.listdir(input_data):
                full_path = os.path.join(input_data, f)
                if os.path.isfile(full_path) and f.lower().endswith(
                    ('.png', '.jpg', '.jpeg', '.pdf', '.docx', '.xlsx', '.xls')
                ):
                    files_to_process.append(full_path)

        elif os.path.isfile(input_data):
            files_to_process.append(input_data)

    elif isinstance(input_data, list):
        for f in input_data:
            if isinstance(f, str) and os.path.isfile(f):
                files_to_process.append(f)

    if not files_to_process:
        return {
            "status": "error",
            "message": "No valid files found",
            "rows": []
        }
    # Process files

    all_rows = []

    for file_path in files_to_process:
        result = process_document(file_path)

        if result.get("status") == "success":
            all_rows.extend(result.get("rows", []))

    return {
        "status": "success",
        "rows": all_rows
    }










