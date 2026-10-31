import io
import os
import re
from typing import Any, Dict, List, Optional, Tuple
import docx
from fastapi import HTTPException, UploadFile, status

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {".txt", ".md", ".docx"}


def parse_inline_markdown(text: str) -> List[Dict[str, Any]]:
    """Parse basic inline markdown (bold, italic, underline) into Tiptap text nodes."""
    if not text:
        return []

    # Regex patterns for markdown formatting
    # Match bold (**...** or __...__), italic (*...* or _..._), underline (<u>...</u>)
    pattern = re.compile(
        r"(\*\*\*(?P<bi_star>.+?)\*\*\*)|"
        r"(\*\*(?P<bold_star>.+?)\*\*)|"
        r"(__single_b(?P<bold_under>.+?)__)|"
        r"(\*(?P<italic_star>.+?)\*)|"
        r"(_(?P<italic_under>.+?)_)|"
        r"(<u>(?P<underline>.+?)</u>)"
    )

    nodes: List[Dict[str, Any]] = []
    last_idx = 0

    for match in pattern.finditer(text):
        start, end = match.span()
        if start > last_idx:
            nodes.append({"type": "text", "text": text[last_idx:start]})

        groups = match.groupdict()
        if groups.get("bi_star"):
            nodes.append({
                "type": "text",
                "text": groups["bi_star"],
                "marks": [{"type": "bold"}, {"type": "italic"}],
            })
        elif groups.get("bold_star") or groups.get("bold_under"):
            nodes.append({
                "type": "text",
                "text": groups.get("bold_star") or groups.get("bold_under"),
                "marks": [{"type": "bold"}],
            })
        elif groups.get("italic_star") or groups.get("italic_under"):
            nodes.append({
                "type": "text",
                "text": groups.get("italic_star") or groups.get("italic_under"),
                "marks": [{"type": "italic"}],
            })
        elif groups.get("underline"):
            nodes.append({
                "type": "text",
                "text": groups["underline"],
                "marks": [{"type": "underline"}],
            })

        last_idx = end

    if last_idx < len(text):
        nodes.append({"type": "text", "text": text[last_idx:]})

    return nodes if nodes else [{"type": "text", "text": text}]


def parse_txt_to_tiptap(content_str: str) -> Dict[str, Any]:
    """Parse plain text into Tiptap document JSON."""
    paragraphs = content_str.split("\n")
    content_nodes: List[Dict[str, Any]] = []

    for p in paragraphs:
        cleaned = p.rstrip("\r")
        if cleaned.strip():
            content_nodes.append({
                "type": "paragraph",
                "content": [{"type": "text", "text": cleaned}],
            })
        else:
            content_nodes.append({"type": "paragraph"})

    if not content_nodes:
        content_nodes = [{"type": "paragraph"}]

    return {"type": "doc", "content": content_nodes}


def parse_md_to_tiptap(content_str: str) -> Dict[str, Any]:
    """Parse Markdown lines into Tiptap document JSON."""
    lines = content_str.split("\n")
    content_nodes: List[Dict[str, Any]] = []

    current_bullet_list: Optional[List[Dict[str, Any]]] = None
    current_ordered_list: Optional[List[Dict[str, Any]]] = None

    def flush_lists():
        nonlocal current_bullet_list, current_ordered_list
        if current_bullet_list:
            content_nodes.append({"type": "bulletList", "content": current_bullet_list})
            current_bullet_list = None
        if current_ordered_list:
            content_nodes.append({"type": "orderedList", "content": current_ordered_list})
            current_ordered_list = None

    for line in lines:
        raw_line = line.rstrip("\r")
        stripped = raw_line.strip()

        if not stripped:
            flush_lists()
            content_nodes.append({"type": "paragraph"})
            continue

        # Headings: # H1, ## H2, ### H3
        heading_match = re.match(r"^(#{1,6})\s+(.*)$", stripped)
        if heading_match:
            flush_lists()
            level = min(len(heading_match.group(1)), 3)
            h_text = heading_match.group(2).strip()
            content_nodes.append({
                "type": "heading",
                "attrs": {"level": level},
                "content": parse_inline_markdown(h_text),
            })
            continue

        # Bullet lists: - item, * item, + item
        bullet_match = re.match(r"^[-*+]\s+(.*)$", stripped)
        if bullet_match:
            if current_ordered_list:
                flush_lists()
            item_text = bullet_match.group(1).strip()
            item_node = {
                "type": "listItem",
                "content": [
                    {
                        "type": "paragraph",
                        "content": parse_inline_markdown(item_text),
                    }
                ],
            }
            if current_bullet_list is None:
                current_bullet_list = []
            current_bullet_list.append(item_node)
            continue

        # Ordered lists: 1. item, 2. item
        ordered_match = re.match(r"^\d+\.\s+(.*)$", stripped)
        if ordered_match:
            if current_bullet_list:
                flush_lists()
            item_text = ordered_match.group(1).strip()
            item_node = {
                "type": "listItem",
                "content": [
                    {
                        "type": "paragraph",
                        "content": parse_inline_markdown(item_text),
                    }
                ],
            }
            if current_ordered_list is None:
                current_ordered_list = []
            current_ordered_list.append(item_node)
            continue

        # Normal paragraph
        flush_lists()
        content_nodes.append({
            "type": "paragraph",
            "content": parse_inline_markdown(stripped),
        })

    flush_lists()

    if not content_nodes:
        content_nodes = [{"type": "paragraph"}]

    return {"type": "doc", "content": content_nodes}


def parse_docx_to_tiptap(file_bytes: bytes) -> Dict[str, Any]:
    """Parse Word DOCX binary into Tiptap document JSON."""
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Malformed or unreadable DOCX file: {str(e)}",
        )

    content_nodes: List[Dict[str, Any]] = []
    current_bullet_list: Optional[List[Dict[str, Any]]] = None
    current_ordered_list: Optional[List[Dict[str, Any]]] = None

    def flush_lists():
        nonlocal current_bullet_list, current_ordered_list
        if current_bullet_list:
            content_nodes.append({"type": "bulletList", "content": current_bullet_list})
            current_bullet_list = None
        if current_ordered_list:
            content_nodes.append({"type": "orderedList", "content": current_ordered_list})
            current_ordered_list = None

    for paragraph in doc.paragraphs:
        style_name = (paragraph.style.name or "").lower() if paragraph.style else ""
        text = paragraph.text.strip()

        # Parse inline runs with bold, italic, underline
        runs_nodes: List[Dict[str, Any]] = []
        for run in paragraph.runs:
            run_text = run.text
            if not run_text:
                continue
            marks: List[Dict[str, Any]] = []
            if run.bold:
                marks.append({"type": "bold"})
            if run.italic:
                marks.append({"type": "italic"})
            if run.underline:
                marks.append({"type": "underline"})

            node: Dict[str, Any] = {"type": "text", "text": run_text}
            if marks:
                node["marks"] = marks
            runs_nodes.append(node)

        if not text:
            flush_lists()
            content_nodes.append({"type": "paragraph"})
            continue

        # Detect heading styles
        if "heading 1" in style_name:
            flush_lists()
            content_nodes.append({
                "type": "heading",
                "attrs": {"level": 1},
                "content": runs_nodes or [{"type": "text", "text": text}],
            })
        elif "heading 2" in style_name:
            flush_lists()
            content_nodes.append({
                "type": "heading",
                "attrs": {"level": 2},
                "content": runs_nodes or [{"type": "text", "text": text}],
            })
        elif "heading 3" in style_name or "heading" in style_name:
            flush_lists()
            content_nodes.append({
                "type": "heading",
                "attrs": {"level": 3},
                "content": runs_nodes or [{"type": "text", "text": text}],
            })
        elif "bullet" in style_name or "list bullet" in style_name:
            if current_ordered_list:
                flush_lists()
            item_node = {
                "type": "listItem",
                "content": [
                    {
                        "type": "paragraph",
                        "content": runs_nodes or [{"type": "text", "text": text}],
                    }
                ],
            }
            if current_bullet_list is None:
                current_bullet_list = []
            current_bullet_list.append(item_node)
        elif "number" in style_name or "list number" in style_name:
            if current_bullet_list:
                flush_lists()
            item_node = {
                "type": "listItem",
                "content": [
                    {
                        "type": "paragraph",
                        "content": runs_nodes or [{"type": "text", "text": text}],
                    }
                ],
            }
            if current_ordered_list is None:
                current_ordered_list = []
            current_ordered_list.append(item_node)
        else:
            flush_lists()
            content_nodes.append({
                "type": "paragraph",
                "content": runs_nodes or [{"type": "text", "text": text}],
            })

    flush_lists()

    if not content_nodes:
        content_nodes = [{"type": "paragraph"}]

    return {"type": "doc", "content": content_nodes}


async def process_document_import(file: UploadFile) -> Tuple[str, Dict[str, Any]]:
    """Validate and process an uploaded document into a document title and Tiptap content."""
    filename = file.filename or "Untitled Document"
    _, ext = os.path.splitext(filename)
    ext_lower = ext.lower()

    if ext_lower not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Supported formats are: .txt, .md, .docx.",
        )

    file_bytes = await file.read()

    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty.",
        )

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of 10 MB ({len(file_bytes)} bytes).",
        )

    # Derive title from filename without extension
    raw_title = os.path.splitext(filename)[0].strip()
    title = raw_title if raw_title else "Untitled Document"

    # Parse according to format
    if ext_lower == ".txt":
        try:
            content_str = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            content_str = file_bytes.decode("latin-1", errors="replace")
        content = parse_txt_to_tiptap(content_str)
    elif ext_lower == ".md":
        try:
            content_str = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            content_str = file_bytes.decode("latin-1", errors="replace")
        content = parse_md_to_tiptap(content_str)
    elif ext_lower == ".docx":
        content = parse_docx_to_tiptap(file_bytes)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'.",
        )

    return title, content

